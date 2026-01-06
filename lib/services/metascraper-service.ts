import metascraper from 'metascraper';
import metascraperTitle from 'metascraper-title';
import metascraperDescription from 'metascraper-description';
import metascraperImage from 'metascraper-image';
import metascraperUrl from 'metascraper-url';
import metascraperAuthor from 'metascraper-author';
import metascraperDate from 'metascraper-date';

const metascraperInstance = metascraper([
  metascraperTitle(),
  metascraperDescription(),
  metascraperImage(),
  metascraperUrl(),
  metascraperAuthor(),
  metascraperDate(),
]);

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
  author?: string;
  date?: string;
}

export class MetascraperService {
  /**
   * Extract structured metadata from HTML using Metascraper
   */
  static async extractMetadata(html: string, url: string): Promise<HtmlMetadata> {
    try {
      if (!html || html.length === 0) {
        return {};
      }

      const raw = await metascraperInstance({ html, url });
      return this.normalizeMetadata(raw);
    } catch (error) {
      console.error('Metascraper extraction failed:', error);
      // Fallback to minimal extraction
      return this.fallbackExtraction(html);
    }
  }

  /**
   * Normalize Metascraper output to our HtmlMetadata interface
   */
  private static normalizeMetadata(raw: any): HtmlMetadata {
    return {
      title: raw.title,
      description: raw.description,
      image: raw.image,
      ogTitle: raw['og:title'],
      ogImage: raw['og:image'],
      ogDescription: raw['og:description'],
      twitterTitle: raw['twitter:title'],
      twitterImage: raw['twitter:image'],
      canonicalUrl: raw.url,
      author: raw.author,
      date: raw.date,
    };
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