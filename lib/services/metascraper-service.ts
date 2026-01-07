import * as cheerio from 'cheerio'

export interface HtmlMetadata {
    title?: string
    description?: string
    image?: string
    ogTitle?: string
    ogImage?: string
    ogDescription?: string
    twitterTitle?: string
    twitterImage?: string
    canonicalUrl?: string
}

export class MetascraperService {
    static async extractMetadata(
        html: string,
        _url: string,
    ): Promise<HtmlMetadata> {
        try {
            if (!html || html.length === 0) {
                return {}
            }

            // Simple HTML parsing - extracts essential metadata without external dependencies
            return MetascraperService.simpleHtmlExtraction(html)
        } catch (error) {
            console.error('Metadata extraction failed:', error)
            return MetascraperService.fallbackExtraction(html)
        }
    }

    /**
     * Robust HTML metadata extraction using Cheerio
     * Extracts Open Graph, Twitter Cards, and standard meta tags
     */
    private static simpleHtmlExtraction(html: string): HtmlMetadata {
        const $ = cheerio.load(html)
        const metadata: HtmlMetadata = {}

        // Extract title
        metadata.title = $('title').first().text().trim()

        // Extract Open Graph metadata
        metadata.ogTitle = $('meta[property="og:title"]').attr('content')
        metadata.ogImage = $('meta[property="og:image"]').attr('content')
        metadata.ogDescription = $('meta[property="og:description"]').attr(
            'content',
        )

        // Extract Twitter Card metadata
        metadata.twitterTitle = $('meta[name="twitter:title"]').attr('content')
        metadata.twitterImage = $('meta[name="twitter:image"]').attr('content')

        // Extract description
        metadata.description = $('meta[name="description"]').attr('content')

        // Extract canonical URL
        metadata.canonicalUrl = $('link[rel="canonical"]').attr('href')

        // Use Open Graph data as fallback for basic fields
        if (!metadata.title && metadata.ogTitle) {
            metadata.title = metadata.ogTitle
        }

        if (!metadata.description && metadata.ogDescription) {
            metadata.description = metadata.ogDescription
        }

        if (!metadata.image && metadata.ogImage) {
            metadata.image = metadata.ogImage
        }

        return metadata
    }

    /**
     * Minimal fallback extraction for critical failures
     */
    private static fallbackExtraction(html: string): HtmlMetadata {
        const metadata: HtmlMetadata = {}

        // Basic title extraction as last resort
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        if (titleMatch) {
            metadata.title = titleMatch[1].trim()
        }

        return metadata
    }
}
