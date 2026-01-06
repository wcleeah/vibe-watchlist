import { MetadataExtractionResponse, MetadataSuggestion, AIMetadataConfig, MetadataCacheEntry, GoogleSearchResult, HtmlMetadata } from '@/lib/types/ai-metadata';
import { AIService } from '@/lib/services/ai-service';
import { MetadataService } from '@/lib/services/metadata-service';
import { VideoPlatform, parseVideoUrl } from '@/lib/utils/url-parser';
import { db } from '@/lib/db';
import { aiMetadataCache, metadataSuggestions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Main orchestration service for AI-powered metadata extraction
 * Coordinates Google Search, HTML scraping, and AI analysis
 */
export class AIMetadataService {
  private config: AIMetadataConfig;
  private aiService: AIService;

  constructor(config: AIMetadataConfig) {
    this.config = config;
    this.aiService = new AIService();
  }

  /**
   * Main entry point for metadata extraction with AI enhancement
   */
  async extractMetadata(url: string): Promise<MetadataExtractionResponse> {
    try {
      // Check cache first
      const cached = await this.getCachedResult(url);
      if (cached) {
      return {
        success: true,
        suggestions: cached.aiAnalysis,
        fallback: {
          title: cached.extractedMetadata?.title,
          thumbnailUrl: cached.extractedMetadata?.ogImage || cached.extractedMetadata?.twitterImage,
        },
      };
      }

      // Detect platform
      const parsed = parseVideoUrl(url);
      const platform = parsed.platform;

      // Parallel processing: search + fetch HTML + basic extraction
      const [searchResults, htmlContent, basicMetadata] = await Promise.allSettled([
        this.performGoogleSearch(url),
        this.fetchHtmlContent(url),
        MetadataService.fetchMetadata(url, platform as VideoPlatform),
      ]);

      // Extract data from results
      const googleResults = searchResults.status === 'fulfilled' ? searchResults.value : [];
      const html = htmlContent.status === 'fulfilled' ? htmlContent.value : '';
      const fallback = basicMetadata.status === 'fulfilled' ? basicMetadata.value : { title: undefined, thumbnailUrl: undefined };

      // Perform AI analysis
      const suggestions = await this.performAIAnalysis(url, googleResults, html, fallback);

      // Cache the results
      await this.cacheResults(url, googleResults, html, suggestions);

      // Track suggestions for analytics
      await this.trackSuggestions(url, suggestions);

      return {
        success: true,
        suggestions,
        fallback: {
          title: fallback?.title,
          thumbnailUrl: fallback?.thumbnailUrl,
        },
      };

    } catch (error) {
      console.error('AI metadata extraction failed:', error);

      // Fallback to basic extraction
      try {
        const parsed = parseVideoUrl(url);
        const basicMetadata = await MetadataService.fetchMetadata(url, parsed.platform as VideoPlatform);

        return {
          success: true,
          suggestions: [{
            title: basicMetadata.title || 'Untitled Video',
            thumbnailUrl: basicMetadata.thumbnailUrl || undefined,
            platform: parsed.platform,
            confidence: 0.3,
            reasoning: 'Fallback to basic extraction due to AI service failure',
          }],
          fallback: {
            title: basicMetadata.title || undefined,
            thumbnailUrl: basicMetadata.thumbnailUrl || undefined,
          },
        };
      } catch (fallbackError) {
        return {
          success: false,
          suggestions: [],
          error: `Failed to extract metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  }

  /**
   * Perform Google Custom Search for context
   */
  private async performGoogleSearch(url: string): Promise<GoogleSearchResult[]> {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const path = urlObj.pathname.slice(1, 50); // first 50 chars of path

      // Create smart search query
      const query = `site:${domain} ${path}`.trim();

      const searchUrl = `https://customsearch.googleapis.com/customsearch/v1?key=${this.config.googleSearchApiKey}&cx=${this.config.googleSearchEngineId}&q=${encodeURIComponent(query)}&num=3`;

      const response = await fetch(searchUrl, {
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`Google Search API error: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];

    } catch (error) {
      console.error('Google search failed:', error);
      return []; // Continue without search results
    }
  }

  /**
   * Fetch HTML content from the URL
   */
  private async fetchHtmlContent(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Video Watchlist AI/1.0 (https://github.com/your-repo)',
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch HTML: ${response.status}`);
      }

      const html = await response.text();
      return html.slice(0, 50000); // Limit to first 50KB

    } catch (error) {
      console.error('HTML fetch failed:', error);
      return '';
    }
  }

  /**
   * Perform AI analysis using OpenRouter
   */
  private async performAIAnalysis(
    url: string,
    searchResults: GoogleSearchResult[],
    htmlContent: string,
    fallbackMetadata: any
  ): Promise<MetadataSuggestion[]> {
    try {
      // Prepare context for AI analysis
      const context = {
        url,
        searchResults: searchResults.slice(0, 2).map(r => ({
          title: r.title,
          snippet: r.snippet,
          hasImage: !!(r.pagemap?.cse_image?.[0]?.src),
        })),
        htmlSnippet: htmlContent.slice(0, 2000), // First 2KB of HTML
        basicMetadata: {
          title: fallbackMetadata?.title,
          hasThumbnail: !!fallbackMetadata?.thumbnailUrl,
        },
      };

      // Use existing AIService for title suggestions
      const titleSuggestions = await this.aiService.generateTitleSuggestions({
        url,
        title: fallbackMetadata?.title,
      }, searchResults);

      // Convert to our format
      const suggestions: MetadataSuggestion[] = titleSuggestions.suggestions.map(suggestion => ({
        title: suggestion.title,
        platform: this.inferPlatform(url, suggestion.title, context),
        confidence: suggestion.confidence,
        reasoning: suggestion.source,
      }));

      // Add thumbnail inference
      for (const suggestion of suggestions) {
        suggestion.thumbnailUrl = this.inferThumbnail(url, htmlContent, searchResults);
      }

      return suggestions.slice(0, 3); // Limit to 3 suggestions

    } catch (error) {
      console.error('AI analysis failed:', error);
      return [];
    }
  }

  /**
   * Infer platform from URL and context
   */
  private inferPlatform(url: string, title: string, context: any): string {
    const parsed = parseVideoUrl(url);

    // Use AI to potentially override platform detection
    // For now, stick with URL-based detection enhanced by content analysis
    if (parsed.platform !== 'unknown') {
      return parsed.platform;
    }

    // Fallback platform detection based on title and content
    const titleLower = title.toLowerCase();
    if (titleLower.includes('netflix')) return 'netflix';
    if (titleLower.includes('nebula')) return 'nebula';
    if (titleLower.includes('twitch')) return 'twitch';
    if (titleLower.includes('youtube')) return 'youtube';

    return 'unknown';
  }

  /**
   * Infer thumbnail URL from available sources
   */
  private inferThumbnail(url: string, htmlContent: string, searchResults: GoogleSearchResult[]): string | undefined {
    // Try search results first
    for (const result of searchResults) {
      if (result.pagemap?.cse_image?.[0]?.src) {
        return result.pagemap.cse_image[0].src;
      }
    }

    // Try extracted metadata
    const extractedMetadata = this.extractMetadataFromHtml(htmlContent);
    if (extractedMetadata.ogImage) return extractedMetadata.ogImage;
    if (extractedMetadata.twitterImage) return extractedMetadata.twitterImage;

    return undefined;
  }

  /**
   * Extract basic title from HTML as fallback
   */
  private extractBasicTitle(htmlContent: string): string | undefined {
    const extractedMetadata = this.extractMetadataFromHtml(htmlContent);
    return extractedMetadata.title || extractedMetadata.ogTitle || extractedMetadata.twitterTitle;
  }

  /**
   * Get cached results if available and not expired
   */
  private async getCachedResult(url: string): Promise<MetadataCacheEntry | null> {
    try {
      const result = await db
        .select()
        .from(aiMetadataCache)
        .where(eq(aiMetadataCache.url, url))
        .limit(1);

      if (result.length === 0) return null;

      const cache = result[0];
      if (new Date(cache.expiresAt) < new Date()) {
        // Expired, clean up
        await db.delete(aiMetadataCache).where(eq(aiMetadataCache.url, url));
        return null;
      }

      return {
        id: cache.id,
        url: cache.url,
        searchResults: cache.searchResults as any[],
        extractedMetadata: cache.extractedMetadata as HtmlMetadata,
        aiAnalysis: cache.aiAnalysis as MetadataSuggestion[],
        confidenceScore: Number(cache.confidenceScore),
        createdAt: cache.createdAt ? new Date(cache.createdAt) : new Date(),
        expiresAt: cache.expiresAt ? new Date(cache.expiresAt) : new Date(),
      };
    } catch (error) {
      console.error('Cache lookup failed:', error);
      return null;
    }
  }

  /**
   * Extract structured metadata from HTML content
   */
  private extractMetadataFromHtml(htmlContent: string): HtmlMetadata {
    const metadata: HtmlMetadata = {};

    // Extract title
    const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }

    // Extract Open Graph metadata
    const ogTitleMatch = htmlContent.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (ogTitleMatch) {
      metadata.ogTitle = ogTitleMatch[1];
    }

    const ogImageMatch = htmlContent.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (ogImageMatch) {
      metadata.ogImage = ogImageMatch[1];
    }

    const ogDescriptionMatch = htmlContent.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    if (ogDescriptionMatch) {
      metadata.ogDescription = ogDescriptionMatch[1];
    }

    // Extract Twitter Card metadata
    const twitterTitleMatch = htmlContent.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i);
    if (twitterTitleMatch) {
      metadata.twitterTitle = twitterTitleMatch[1];
    }

    const twitterImageMatch = htmlContent.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    if (twitterImageMatch) {
      metadata.twitterImage = twitterImageMatch[1];
    }

    const twitterDescriptionMatch = htmlContent.match(/<meta\s+name=["']twitter:description["']\s+content=["']([^"']+)["']/i);
    if (twitterDescriptionMatch) {
      metadata.twitterDescription = twitterDescriptionMatch[1];
    }

    // Extract description
    const descriptionMatch = htmlContent.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    if (descriptionMatch) {
      metadata.description = descriptionMatch[1];
    }

    // Extract canonical URL
    const canonicalMatch = htmlContent.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
    if (canonicalMatch) {
      metadata.canonicalUrl = canonicalMatch[1];
    }

    return metadata;
  }

  /**
   * Cache AI analysis results
   */
  private async cacheResults(
    url: string,
    searchResults: GoogleSearchResult[],
    htmlContent: string,
    suggestions: MetadataSuggestion[]
  ): Promise<void> {
    try {
      const avgConfidence = suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length;
      const extractedMetadata = this.extractMetadataFromHtml(htmlContent);

      await db.insert(aiMetadataCache).values({
        url,
        searchResults,
        extractedMetadata,
        aiAnalysis: suggestions,
        confidenceScore: avgConfidence.toString(),
        expiresAt: new Date(Date.now() + this.config.cacheTtl),
      });
    } catch (error) {
      console.error('Cache storage failed:', error);
      // Don't fail the whole operation for cache issues
    }
  }

  /**
   * Track user suggestions for analytics
   */
  private async trackSuggestions(url: string, suggestions: MetadataSuggestion[]): Promise<void> {
    try {
      await db.insert(metadataSuggestions).values({
        url,
        suggestions,
      });
    } catch (error) {
      console.error('Suggestion tracking failed:', error);
      // Don't fail the operation
    }
  }
}

// Export singleton instance
const aiMetadataConfig: AIMetadataConfig = {
  googleSearchApiKey: process.env.GOOGLE_SEARCH_API_KEY!,
  googleSearchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID!,
  openRouterApiKey: process.env.OPENROUTER_API_KEY!,
  cacheTtl: Number(process.env.METADATA_CACHE_TTL) || 7 * 24 * 60 * 60 * 1000, // 7 days
  timeout: Number(process.env.AI_ANALYSIS_TIMEOUT) || 15000, // 15 seconds
};

export const aiMetadataService = new AIMetadataService(aiMetadataConfig);