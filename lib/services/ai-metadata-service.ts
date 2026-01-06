import {
    MetadataExtractionResponse,
    MetadataSuggestion,
    AIMetadataConfig,
    MetadataCacheEntry,
    GoogleSearchResult,
    HtmlMetadata,
} from "@/lib/types/ai-metadata";
import { AIService } from "@/lib/services/ai-service";
import { SharedMetadataService } from "@/lib/services/shared-metadata-service";
import { MetascraperService } from "@/lib/services/metascraper-service";
import { parseVideoUrl } from "@/lib/utils/url-parser";
import { db } from "@/lib/db";
import { aiMetadataCache, metadataSuggestions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

    async extractMetadata(url: string): Promise<MetadataExtractionResponse> {
        console.log(
            "🔍 AI METADATA SERVICE: Starting extractMetadata for URL:",
            url,
        );

        try {
            console.log("🔍 AI METADATA SERVICE: Checking cache for URL:", url);
            // Check cache first
            const cached = await this.getCachedResult(url);
            console.log(
                "🔍 AI METADATA SERVICE: Cache result:",
                cached
                    ? "HIT - returning cached data"
                    : "MISS - proceeding with extraction",
            );

            if (cached) {
                console.log(
                    "🔍 AI METADATA SERVICE: Returning cached suggestions:",
                    cached.aiAnalysis?.length || 0,
                    "items",
                );
                return {
                    success: true,
                    suggestions: cached.aiAnalysis,
                    fallback: {
                        title: cached.extractedMetadata?.title,
                        thumbnailUrl:
                            cached.extractedMetadata?.ogImage ||
                            cached.extractedMetadata?.twitterImage,
                    },
                };
            }

            console.log(
                "🔍 AI METADATA SERVICE: No cache hit, parsing URL for platform detection",
            );
            // Detect platform and route accordingly
            const parsed = parseVideoUrl(url);
            const platform = parsed.platform;
            console.log("🔍 AI METADATA SERVICE: Parsed platform:", platform);

            const strategy =
                SharedMetadataService.getPlatformStrategy(platform);
            console.log(
                "🔍 AI METADATA SERVICE: Selected strategy:",
                strategy,
                "for platform:",
                platform,
            );

            switch (strategy) {
                case "official":
                    console.log(
                        "🔍 AI METADATA SERVICE: Routing to handleOfficialPlatform",
                    );
                    return this.handleOfficialPlatform(url, platform);
                case "ai":
                    console.log(
                        "🔍 AI METADATA SERVICE: Routing to handleAIPlatform",
                    );
                    return this.handleAIPlatform(url, platform);
                default:
                    console.log(
                        "🔍 AI METADATA SERVICE: Routing to handleFallbackPlatform (strategy:",
                        strategy,
                        ")",
                    );
                    return this.handleFallbackPlatform(url, platform);
            }
        } catch (error) {
            console.error(
                "❌ AI METADATA SERVICE: extractMetadata failed:",
                error,
            );
            console.error(
                "❌ AI METADATA SERVICE: Error details:",
                error instanceof Error ? error.stack : "Unknown error type",
            );
            return {
                success: false,
                suggestions: [],
                error: `Failed to extract metadata: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Handle platforms with official APIs (YouTube, Twitch)
     */
    private async handleOfficialPlatform(
        url: string,
        platform: string,
    ): Promise<MetadataExtractionResponse> {
        console.log(
            "🎯 OFFICIAL PLATFORM HANDLER: Starting for platform:",
            platform,
            "URL:",
            url,
        );

        try {
            let metadata;
            console.log(
                "🎯 OFFICIAL PLATFORM HANDLER: Determining API call based on platform",
            );

            if (platform === "youtube") {
                console.log(
                    "🎯 OFFICIAL PLATFORM HANDLER: Calling YouTube oEmbed API",
                );
                metadata =
                    await SharedMetadataService.extractYouTubeMetadata(url);
                console.log(
                    "🎯 OFFICIAL PLATFORM HANDLER: YouTube API response:",
                    metadata ? "SUCCESS" : "NULL",
                );
            } else if (platform === "twitch") {
                console.log(
                    "🎯 OFFICIAL PLATFORM HANDLER: Calling Twitch Helix API",
                );
                metadata =
                    await SharedMetadataService.extractTwitchMetadata(url);
                console.log(
                    "🎯 OFFICIAL PLATFORM HANDLER: Twitch API response:",
                    metadata ? "SUCCESS" : "NULL",
                );
            } else {
                console.log(
                    "🎯 OFFICIAL PLATFORM HANDLER: Unsupported official platform:",
                    platform,
                );
                throw new Error(`Unsupported official platform: ${platform}`);
            }

            console.log(
                "🎯 OFFICIAL PLATFORM HANDLER: Fetching HTML content for thumbnail prioritization",
            );
            // Fetch HTML content to prioritize meta tag thumbnails
            const htmlContent = await this.fetchHtmlContent(url);
            console.log(
                "🎯 OFFICIAL PLATFORM HANDLER: HTML content fetched, length:",
                htmlContent.length,
            );

            console.log(
                "🎯 OFFICIAL PLATFORM HANDLER: Extracting metadata from HTML",
            );
            const extractedMetadata = await MetascraperService.extractMetadata(
                htmlContent,
                url,
            );
            console.log(
                "🎯 OFFICIAL PLATFORM HANDLER: HTML metadata extracted - ogImage:",
                !!extractedMetadata.ogImage,
                "twitterImage:",
                !!extractedMetadata.twitterImage,
            );

            // Prioritize thumbnails: HTML meta tags → API thumbnails → undefined
            const prioritizedThumbnail =
                extractedMetadata.ogImage ||
                extractedMetadata.twitterImage ||
                metadata.thumbnailUrl;

            console.log(
                "🎯 OFFICIAL PLATFORM HANDLER: Prioritized thumbnail selected:",
                prioritizedThumbnail ? "HTML meta tag" : "API thumbnail",
            );

            console.log(
                "🎯 OFFICIAL PLATFORM HANDLER: Creating response with confidence 1.0",
            );
            const response = {
                success: true,
                suggestions: [
                    {
                        title: metadata.title || "Untitled Video",
                        thumbnailUrl: prioritizedThumbnail || undefined,
                        platform,
                        confidence: 1.0, // Official API = perfect confidence
                        reasoning: `Official ${platform} API with meta tag thumbnail prioritization`,
                    },
                ],
                fallback: {
                    title: metadata.title || undefined,
                    thumbnailUrl: prioritizedThumbnail || undefined,
                },
            };

            console.log(
                "🎯 OFFICIAL PLATFORM HANDLER: Returning official platform response with",
                response.suggestions.length,
                "suggestions",
            );
            return response;
        } catch (error) {
            // Official API failed - fallback to AI
            console.warn(
                "! OFFICIAL PLATFORM HANDLER: Official API failed, falling back to AI analysis:",
                error,
            );
            console.warn(
                "! OFFICIAL PLATFORM HANDLER: Error details:",
                error instanceof Error ? error.message : "Unknown error",
            );
            console.log(
                "🎯 OFFICIAL PLATFORM HANDLER: Initiating fallback to AI platform handler",
            );
            return this.handleAIPlatform(url, platform);
        }
    }

    /**
     * Handle unknown platforms with full AI analysis
     */
    private async handleAIPlatform(
        url: string,
        platform: string,
    ): Promise<MetadataExtractionResponse> {
        console.log(
            "🤖 AI PLATFORM HANDLER: Starting full AI analysis for platform:",
            platform,
            "URL:",
            url,
        );

        // Google Search + HTML + Metascraper + AI Analysis
        console.log(
            "🤖 AI PLATFORM HANDLER: Starting parallel operations - Google Search and HTML fetch",
        );
        const [searchResults, htmlContent] = await Promise.allSettled([
            this.performGoogleSearch(url),
            this.fetchHtmlContent(url),
        ]);

        const googleResults =
            searchResults.status === "fulfilled" ? searchResults.value : [];
        const html =
            htmlContent.status === "fulfilled" ? htmlContent.value : "";

        console.log("🤖 AI PLATFORM HANDLER: Parallel operations complete");
        console.log(
            "🤖 AI PLATFORM HANDLER: Google search results:",
            googleResults.length,
            "items",
        );
        console.log(
            "🤖 AI PLATFORM HANDLER: HTML content length:",
            html.length,
            "characters",
        );

        if (searchResults.status === "rejected") {
            console.warn(
                "! AI PLATFORM HANDLER: Google search failed:",
                searchResults.reason,
            );
        }
        if (htmlContent.status === "rejected") {
            console.warn(
                "! AI PLATFORM HANDLER: HTML fetch failed:",
                htmlContent.reason,
            );
        }

        // Use Metascraper instead of manual regex
        console.log(
            "🤖 AI PLATFORM HANDLER: Starting Metascraper metadata extraction",
        );
        const extractedMetadata = await MetascraperService.extractMetadata(
            html,
            url,
        );
        console.log("🤖 AI PLATFORM HANDLER: Metascraper extracted metadata:", {
            hasTitle: !!extractedMetadata.title,
            hasDescription: !!extractedMetadata.description,
            hasOgImage: !!extractedMetadata.ogImage,
            hasTwitterImage: !!extractedMetadata.twitterImage,
        });
        console.log("🤖 AI PLATFORM HANDLER: Full extracted metadata:", JSON.stringify(extractedMetadata, null, 2));

        // AI analysis with Google context
        console.log(
            "🤖 AI PLATFORM HANDLER: Starting AI analysis with context",
        );
        const suggestions = await this.performAIAnalysis(
            url,
            googleResults,
            html,
            extractedMetadata,
        );
        console.log(
            "🤖 AI PLATFORM HANDLER: AI analysis complete, generated",
            suggestions.length,
            "suggestions",
        );

        // Cache the results
        console.log("🤖 AI PLATFORM HANDLER: Caching results");
        await this.cacheResults(url, googleResults, html, suggestions);

        // Track suggestions for analytics
        console.log(
            "🤖 AI PLATFORM HANDLER: Tracking suggestions for analytics",
        );
        await this.trackSuggestions(url, suggestions);

        const response = {
            success: true,
            suggestions,
            fallback: {
                title: extractedMetadata.title,
                thumbnailUrl:
                    extractedMetadata.ogImage || extractedMetadata.twitterImage,
            },
        };

        console.log(
            "🤖 AI PLATFORM HANDLER: Returning AI platform response with",
            suggestions.length,
            "suggestions",
        );
        return response;
    }

    /**
     * Handle fallback cases with basic HTML extraction
     */
    private async handleFallbackPlatform(
        url: string,
        platform: string,
    ): Promise<MetadataExtractionResponse> {
        try {
            const metadata =
                await SharedMetadataService.extractHtmlMetadata(url);

            return {
                success: true,
                suggestions: [
                    {
                        title: metadata.title || "Untitled Video",
                        thumbnailUrl: metadata.thumbnailUrl || undefined,
                        platform,
                        confidence: 0.1, // Basic extraction only
                        reasoning: "Basic HTML extraction only",
                    },
                ],
                fallback: {
                    title: metadata.title || undefined,
                    thumbnailUrl: metadata.thumbnailUrl || undefined,
                },
            };
        } catch (error) {
            return {
                success: false,
                suggestions: [],
                error: `Fallback extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Perform AI analysis using OpenRouter
     */
    private async performAIAnalysis(
        url: string,
        searchResults: GoogleSearchResult[],
        htmlContent: string,
        extractedMetadata: HtmlMetadata,
    ): Promise<MetadataSuggestion[]> {
        console.log("🧠 AI ANALYSIS: Starting AI analysis for URL:", url);

        try {
            console.log("🧠 AI ANALYSIS: Preparing context for AI analysis");
            // Prepare context for AI analysis
            const context = {
                url,
                searchResults: searchResults.slice(0, 2).map((r) => ({
                    title: r.title,
                    snippet: r.snippet,
                    hasImage: !!r.pagemap?.cse_image?.[0]?.src,
                })),
                htmlSnippet: htmlContent.slice(0, 2000), // First 2KB of HTML
                extractedMetadata: {
                    title: extractedMetadata.title,
                    description: extractedMetadata.description,
                    hasImage: !!(
                        extractedMetadata.ogImage ||
                        extractedMetadata.twitterImage
                    ),
                },
            };

            console.log(
                "🧠 AI ANALYSIS: Context prepared with",
                context.searchResults.length,
                "search results",
            );
            console.log(
                "🧠 AI ANALYSIS: HTML snippet length:",
                context.htmlSnippet.length,
                "characters",
            );
            console.log(
                "🧠 AI ANALYSIS: Extracted metadata - title:",
                !!context.extractedMetadata.title,
                "description:",
                !!context.extractedMetadata.description,
                "image:",
                context.extractedMetadata.hasImage,
            );

            // Log the full context object for debugging
            console.log("🧠 AI ANALYSIS: Full context object:", JSON.stringify(context, null, 2));

            // Use existing AIService for title suggestions
            console.log(
                "🧠 AI ANALYSIS: Calling AIService.generateTitleSuggestions",
            );

            // Log the request parameters being sent to AI service
            const aiServiceRequestParams = {
                metadata: {
                    url,
                    title: extractedMetadata.title,
                },
                searchResults: searchResults,
            };
            console.log("🧠 AI ANALYSIS: Request parameters to AIService:", JSON.stringify(aiServiceRequestParams, null, 2));

            const titleSuggestions =
                await this.aiService.generateTitleSuggestions(
                    {
                        url,
                        title: extractedMetadata.title,
                    },
                    searchResults,
                );

            console.log(
                "🧠 AI ANALYSIS: AIService returned",
                titleSuggestions.suggestions?.length || 0,
                "raw suggestions",
            );

            // Log the full response from AI service
            console.log("🧠 AI ANALYSIS: Full AIService response:", JSON.stringify(titleSuggestions, null, 2));

            // Convert to our format
            console.log(
                "🧠 AI ANALYSIS: Converting suggestions to MetadataSuggestion format",
            );
            const suggestions: MetadataSuggestion[] =
                titleSuggestions.suggestions.map((suggestion) => {
                    const platform = this.inferPlatform(
                        url,
                        suggestion.title,
                        context,
                    );
                    const thumbnailUrl = this.inferThumbnail(
                        url,
                        htmlContent,
                        searchResults,
                        extractedMetadata,
                    );

                    console.log("🧠 AI ANALYSIS: Converting suggestion:", {
                        title: suggestion.title.substring(0, 50) + "...",
                        confidence: suggestion.confidence,
                        inferredPlatform: platform,
                        hasThumbnail: !!thumbnailUrl,
                    });

                    return {
                        title: suggestion.title,
                        platform: platform,
                        confidence: suggestion.confidence,
                        reasoning: suggestion.source,
                        thumbnailUrl: thumbnailUrl,
                    };
                });

            console.log(
                "🧠 AI ANALYSIS: Total suggestions before limiting:",
                suggestions.length,
            );
            const limitedSuggestions = suggestions.slice(0, 3); // Limit to 3 suggestions
            console.log(
                "🧠 AI ANALYSIS: Returning",
                limitedSuggestions.length,
                "suggestions after limiting",
            );
            console.log("🧠 AI ANALYSIS: Final suggestions array:", JSON.stringify(limitedSuggestions, null, 2));

            return limitedSuggestions;
        } catch (error) {
            console.error("❌ AI ANALYSIS: AI analysis failed:", error);
            console.error(
                "❌ AI ANALYSIS: Error details:",
                error instanceof Error ? error.stack : "Unknown error type",
            );
            return [];
        }
    }

    /**
     * Perform Google Custom Search for context
     */
    private async performGoogleSearch(
        url: string,
    ): Promise<GoogleSearchResult[]> {
        console.log("🔍 GOOGLE SEARCH: Starting Google search for URL:", url);

        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            const path = urlObj.pathname.slice(1, 50); // first 50 chars of path

            console.log(
                "🔍 GOOGLE SEARCH: Parsed URL - domain:",
                domain,
                "path:",
                path,
            );

            // Create smart search query
            const query = `site:${domain} ${path}`.trim();
            console.log("🔍 GOOGLE SEARCH: Generated search query:", query);

            const searchUrl = `https://customsearch.googleapis.com/customsearch/v1?key=${this.config.googleSearchApiKey}&cx=${this.config.googleSearchEngineId}&q=${encodeURIComponent(query)}&num=3`;
            console.log(
                "🔍 GOOGLE SEARCH: Making API request to Google Custom Search",
            );

            const response = await fetch(searchUrl, {
                signal: AbortSignal.timeout(this.config.timeout),
            });

            console.log(
                "🔍 GOOGLE SEARCH: API response status:",
                response.status,
            );

            if (!response.ok) {
                console.log(
                    "🔍 GOOGLE SEARCH: API request failed with status:",
                    response.status,
                );

                // Log response body for debugging
                try {
                    const errorBody = await response.text();
                    console.log(
                        "🔍 GOOGLE SEARCH: Error response body:",
                        errorBody.substring(0, 500),
                    );
                } catch (bodyError) {
                    console.log(
                        "🔍 GOOGLE SEARCH: Could not read error response body:",
                        bodyError,
                    );
                }

                throw new Error(`Google Search API error: ${response.status}`);
            }

            const data = await response.json();
            console.log("🔍 GOOGLE SEARCH: Full API response body:", JSON.stringify(data, null, 2));

            const results = data.items || [];
            console.log(
                "🔍 GOOGLE SEARCH: Successfully retrieved",
                results.length,
                "search results",
            );

            if (results.length > 0) {
                console.log(
                    "🔍 GOOGLE SEARCH: First result title:",
                    results[0].title?.substring(0, 50),
                );
            }

            return results;
        } catch (error) {
            console.error("❌ GOOGLE SEARCH: Google search failed:", error);
            console.error(
                "❌ GOOGLE SEARCH: Error details:",
                error instanceof Error ? error.message : "Unknown error",
            );
            console.log(
                "🔍 GOOGLE SEARCH: Returning empty results, continuing without search context",
            );
            return []; // Continue without search results
        }
    }

    /**
     * Fetch HTML content from the URL
     */
    private async fetchHtmlContent(url: string): Promise<string> {
        console.log("🌐 HTML FETCH: Starting HTML content fetch for URL:", url);

        try {
            console.log(
                "🌐 HTML FETCH: Making HTTP request with timeout:",
                this.config.timeout,
                "ms",
            );

            console.log("🌐 HTML FETCH: Request headers:", {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
            });

            const response = await fetch(url, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
                },
                signal: AbortSignal.timeout(this.config.timeout),
            });

            console.log(
                "🌐 HTML FETCH: HTTP response status:",
                response.status,
                "content-type:",
                response.headers.get("content-type"),
            );

            if (!response.ok) {
                console.log(
                    "🌐 HTML FETCH: HTTP request failed with status:",
                    response.status,
                );

                // Log response body for debugging
                try {
                    const errorBody = await response.text();
                    console.log(
                        "🌐 HTML FETCH: Error response body:",
                        errorBody.substring(0, 500),
                    );
                } catch (bodyError) {
                    console.log(
                        "🌐 HTML FETCH: Could not read error response body:",
                        bodyError,
                    );
                }

                throw new Error(`Failed to fetch HTML: ${response.status}`);
            }

            const html = await response.text();
            console.log("🌐 HTML FETCH: Full response body (first 1000 chars):", html.substring(0, 1000));

            const limitedHtml = html.slice(0, 50000); // Limit to first 50KB

            console.log("🌐 HTML FETCH: Successfully fetched HTML content");
            console.log(
                "🌐 HTML FETCH: Original HTML length:",
                html.length,
                "characters",
            );
            console.log(
                "🌐 HTML FETCH: Limited to:",
                limitedHtml.length,
                "characters",
            );
            console.log(
                "🌐 HTML FETCH: HTML preview (first 200 chars):",
                limitedHtml.substring(0, 200),
            );

            return limitedHtml;
        } catch (error) {
            console.error("❌ HTML FETCH: HTML fetch failed:", error);
            console.error(
                "❌ HTML FETCH: Error details:",
                error instanceof Error ? error.message : "Unknown error",
            );
            console.log(
                "🌐 HTML FETCH: Returning empty string, continuing without HTML context",
            );
            return "";
        }
    }

    /**
     * Infer platform from URL and context
     */
    private inferPlatform(url: string, title: string, context: any): string {
        console.log("🔍 PLATFORM INFERENCE: Inferring platform for URL:", url);
        console.log("🔍 PLATFORM INFERENCE: Title:", title.substring(0, 50));

        const parsed = parseVideoUrl(url);
        console.log(
            "🔍 PLATFORM INFERENCE: URL parser detected platform:",
            parsed.platform,
        );

        // Use AI to potentially override platform detection
        // For now, stick with URL-based detection enhanced by content analysis
        if (parsed.platform !== "unknown") {
            console.log(
                "🔍 PLATFORM INFERENCE: Using URL-detected platform:",
                parsed.platform,
            );
            return parsed.platform;
        }

        console.log(
            "🔍 PLATFORM INFERENCE: URL platform is unknown, checking title-based detection",
        );

        // Fallback platform detection based on title and content
        const titleLower = title.toLowerCase();
        console.log(
            "🔍 PLATFORM INFERENCE: Checking title for platform keywords",
        );

        if (titleLower.includes("netflix")) {
            console.log("🔍 PLATFORM INFERENCE: Detected Netflix from title");
            return "netflix";
        }
        if (titleLower.includes("nebula")) {
            console.log("🔍 PLATFORM INFERENCE: Detected Nebula from title");
            return "nebula";
        }
        if (titleLower.includes("twitch")) {
            console.log("🔍 PLATFORM INFERENCE: Detected Twitch from title");
            return "twitch";
        }
        if (titleLower.includes("youtube")) {
            console.log("🔍 PLATFORM INFERENCE: Detected YouTube from title");
            return "youtube";
        }

        console.log(
            "🔍 PLATFORM INFERENCE: No platform detected, returning unknown",
        );
        return "unknown";
    }

    /**
     * Infer thumbnail URL from available sources, prioritizing meta tags
     */
    private inferThumbnail(
        url: string,
        htmlContent: string,
        searchResults: GoogleSearchResult[],
        extractedMetadata: HtmlMetadata,
    ): string | undefined {
        console.log("🖼 THUMBNAIL INFERENCE: Inferring thumbnail for URL:", url);

        // PRIORITY 1: Meta tag thumbnails (og:image, twitter:image)
        const metaThumbnail = extractedMetadata.ogImage || extractedMetadata.twitterImage;
        if (metaThumbnail) {
            console.log("🖼 THUMBNAIL INFERENCE: Using meta tag thumbnail:", metaThumbnail);
            return metaThumbnail;
        }

        console.log(
            "🖼 THUMBNAIL INFERENCE: No meta tag thumbnails found, checking",
            searchResults.length,
            "search results for images",
        );

        // PRIORITY 2: Search results
        for (const result of searchResults) {
            if (result.pagemap?.cse_image?.[0]?.src) {
                const thumbnailUrl = result.pagemap.cse_image[0].src;
                console.log(
                    "🖼 THUMBNAIL INFERENCE: Found thumbnail in search result:",
                    thumbnailUrl,
                );
                return thumbnailUrl;
            }
        }

        console.log("🖼 THUMBNAIL INFERENCE: No thumbnail found");
        return undefined;
    }

    /**
     * Get cached results if available and not expired
     */
    private async getCachedResult(
        url: string,
    ): Promise<MetadataCacheEntry | null> {
        console.log("💾 CACHE LOOKUP: Checking cache for URL:", url);

        try {
            console.log("💾 CACHE LOOKUP: Querying database for cached entry");
            const result = await db
                .select()
                .from(aiMetadataCache)
                .where(eq(aiMetadataCache.url, url))
                .limit(1);

            console.log(
                "💾 CACHE LOOKUP: Database query returned",
                result.length,
                "results",
            );

            if (result.length === 0) {
                console.log("💾 CACHE LOOKUP: No cached entry found");
                return null;
            }

            const cache = result[0];
            const expiresAt = new Date(cache.expiresAt);
            const now = new Date();

            console.log("💾 CACHE LOOKUP: Cache entry found");
            console.log(
                "💾 CACHE LOOKUP: Cache expires at:",
                expiresAt.toISOString(),
            );
            console.log("💾 CACHE LOOKUP: Current time:", now.toISOString());
            console.log("💾 CACHE LOOKUP: Cache expired?", expiresAt < now);

            if (expiresAt < now) {
                // Expired, clean up
                console.log("💾 CACHE LOOKUP: Cache expired, deleting entry");
                await db
                    .delete(aiMetadataCache)
                    .where(eq(aiMetadataCache.url, url));
                console.log("💾 CACHE LOOKUP: Expired cache entry deleted");
                return null;
            }

            console.log("💾 CACHE LOOKUP: Cache valid, parsing cached data");
            const cachedEntry = {
                id: cache.id,
                url: cache.url,
                searchResults: cache.searchResults as any[],
                extractedMetadata: cache.extractedMetadata as HtmlMetadata,
                aiAnalysis: cache.aiAnalysis as MetadataSuggestion[],
                confidenceScore: Number(cache.confidenceScore),
                createdAt: cache.createdAt
                    ? new Date(cache.createdAt)
                    : new Date(),
                expiresAt: cache.expiresAt
                    ? new Date(cache.expiresAt)
                    : new Date(),
            };

            console.log(
                "💾 CACHE LOOKUP: Successfully parsed cached entry with",
                cachedEntry.aiAnalysis?.length || 0,
                "suggestions",
            );
            return cachedEntry;
        } catch (error) {
            console.error("❌ CACHE LOOKUP: Cache lookup failed:", error);
            console.error(
                "❌ CACHE LOOKUP: Error details:",
                error instanceof Error ? error.stack : "Unknown error",
            );
            console.log("💾 CACHE LOOKUP: Returning null due to cache error");
            return null;
        }
    }

    /**
     * Cache AI analysis results
     */
    private async cacheResults(
        url: string,
        searchResults: GoogleSearchResult[],
        htmlContent: string,
        suggestions: MetadataSuggestion[],
    ): Promise<void> {
        console.log("💾 CACHE STORAGE: Starting cache storage for URL:", url);

        try {
            console.log(
                "💾 CACHE STORAGE: Calculating average confidence from",
                suggestions.length,
                "suggestions",
            );
            const avgConfidence =
                suggestions.reduce((sum, s) => sum + s.confidence, 0) /
                suggestions.length;
            console.log("💾 CACHE STORAGE: Average confidence:", avgConfidence);

            console.log("💾 CACHE STORAGE: Extracting metadata for caching");
            const extractedMetadata = await MetascraperService.extractMetadata(
                htmlContent,
                url,
            );
            console.log("💾 CACHE STORAGE: Metadata extracted for cache:", {
                hasTitle: !!extractedMetadata.title,
                hasDescription: !!extractedMetadata.description,
            });

            const expiresAt = new Date(Date.now() + this.config.cacheTtl);
            console.log(
                "💾 CACHE STORAGE: Cache will expire at:",
                expiresAt.toISOString(),
            );

            const cacheData = {
                url,
                searchResults,
                extractedMetadata,
                aiAnalysis: suggestions,
                confidenceScore: avgConfidence.toString(),
                expiresAt: expiresAt,
            };
            console.log("💾 CACHE STORAGE: Data being cached:", JSON.stringify(cacheData, null, 2));

            console.log("💾 CACHE STORAGE: Inserting into database");
            await db.insert(aiMetadataCache).values(cacheData);

            console.log("💾 CACHE STORAGE: Successfully cached results");
        } catch (error) {
            console.error("❌ CACHE STORAGE: Cache storage failed:", error);
            console.error(
                "❌ CACHE STORAGE: Error details:",
                error instanceof Error ? error.stack : "Unknown error",
            );
            console.log(
                "💾 CACHE STORAGE: Continuing without caching (non-blocking error)",
            );
            // Don't fail the whole operation for cache issues
        }
    }

    /**
     * Track user suggestions for analytics
     */
    private async trackSuggestions(
        url: string,
        suggestions: MetadataSuggestion[],
    ): Promise<void> {
        try {
            await db.insert(metadataSuggestions).values({
                url,
                suggestions,
            });
        } catch (error) {
            console.error("Suggestion tracking failed:", error);
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
