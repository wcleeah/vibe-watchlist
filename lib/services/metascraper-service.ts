export interface HtmlMetadata {
  title?: string;
  description?: string;
  image?: string;
  ogTitle?: string;
  ogImage?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterImage?: string;
  canonicalUrl?: string;
}

export class MetascraperService {
  static async extractMetadata(html: string, url: string): Promise<HtmlMetadata> {
    try {
      if (!html || html.length === 0) {
        return {};
      }

      // Simple HTML parsing - extracts essential metadata without external dependencies
      return this.simpleHtmlExtraction(html);
    } catch (error) {
      console.error('Metadata extraction failed:', error);
      return this.fallbackExtraction(html);
    }
  }

  /**
   * Simple HTML metadata extraction using regex patterns
   * Extracts Open Graph, Twitter Cards, and standard meta tags
   */
  private static simpleHtmlExtraction(html: string): HtmlMetadata {
    const metadata: HtmlMetadata = {};

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }

    // Extract Open Graph metadata
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (ogTitleMatch) {
      metadata.ogTitle = ogTitleMatch[1];
    }

    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (ogImageMatch) {
      metadata.ogImage = ogImageMatch[1];
    }

    const ogDescriptionMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    if (ogDescriptionMatch) {
      metadata.ogDescription = ogDescriptionMatch[1];
    }

    // Extract Twitter Card metadata
    const twitterTitleMatch = html.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i);
    if (twitterTitleMatch) {
      metadata.twitterTitle = twitterTitleMatch[1];
    }

    const twitterImageMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    if (twitterImageMatch) {
      metadata.twitterImage = twitterImageMatch[1];
    }

    // Extract description
    const descriptionMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    if (descriptionMatch) {
      metadata.description = descriptionMatch[1];
    }

    // Extract canonical URL
    const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
    if (canonicalMatch) {
      metadata.canonicalUrl = canonicalMatch[1];
    }

    // Use Open Graph data as fallback for basic fields
    if (!metadata.title && metadata.ogTitle) {
      metadata.title = metadata.ogTitle;
    }

    if (!metadata.description && metadata.ogDescription) {
      metadata.description = metadata.ogDescription;
    }

    if (!metadata.image && metadata.ogImage) {
      metadata.image = metadata.ogImage;
    }

    return metadata;
  }

  /**
   * Minimal fallback extraction for critical failures
   */
  private static fallbackExtraction(html: string): HtmlMetadata {
    const metadata: HtmlMetadata = {};

    // Basic title extraction as last resort
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }

    return metadata;
  }
}