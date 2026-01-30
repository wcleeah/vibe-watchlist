import { z } from 'zod'

// Request/Response schemas for AI metadata extraction
export const MetadataSuggestionSchema = z.object({
    title: z.string(),
    thumbnailUrl: z.string().optional(),
    platform: z.string(),
    confidence: z.number().min(0).max(1),
    reasoning: z.string().optional(),
})

export const MetadataExtractionResponseSchema = z.object({
    success: z.boolean(),
    suggestions: z.array(MetadataSuggestionSchema),
    fallback: z
        .object({
            title: z.string().optional(),
            thumbnailUrl: z.string().nullable().optional(),
        })
        .optional(),
    error: z.string().optional(),
})

export type MetadataSuggestion = z.infer<typeof MetadataSuggestionSchema>
export type MetadataExtractionResponse = z.infer<
    typeof MetadataExtractionResponseSchema
>

// AI service configuration
export interface AIMetadataConfig {
    googleSearchApiKey: string
    googleSearchEngineId: string
    openRouterApiKey: string
    cacheTtl: number
    timeout: number
}

// Cache entry for AI results
export interface MetadataCacheEntry {
    id: number
    url: string
    searchResults: GoogleSearchResult[]
    extractedMetadata: HtmlMetadata
    aiAnalysis: MetadataSuggestion[]
    confidenceScore: number
    createdAt: Date
    expiresAt: Date
}

// Search result from Google Custom Search
export interface GoogleSearchResult {
    title: string
    link: string
    snippet: string
    pagemap?: {
        cse_image?: Array<{ src: string }>
        metatags?: Array<Record<string, string>>
    }
}

// HTML metadata extracted from page
export interface HtmlMetadata {
    title?: string
    description?: string
    image?: string
    ogTitle?: string
    ogDescription?: string
    ogImage?: string
    twitterTitle?: string
    twitterDescription?: string
    twitterImage?: string
    canonicalUrl?: string
}
