import Exa from 'exa-js'

import type { SearchResultContext } from '@/lib/types/ai-metadata'

export interface SearchWebInput {
    query: string
    domain?: string
    language?: string
    maxResults?: number
}

export class SearchToolService {
    private static exaClient: Exa | null = null

    private static getClient(): Exa {
        if (!process.env.EXA_API_KEY) {
            throw new Error('EXA_API_KEY environment variable is required')
        }

        if (!SearchToolService.exaClient) {
            SearchToolService.exaClient = new Exa(process.env.EXA_API_KEY)
        }

        return SearchToolService.exaClient
    }

    static async searchWeb({
        query,
        domain,
        language,
        maxResults = 4,
    }: SearchWebInput): Promise<SearchResultContext[]> {
        const exa = SearchToolService.getClient()
        const searchResponse = await exa.search(query, {
            type: 'auto',
            numResults: maxResults,
            ...(domain ? { includeDomains: [domain] } : {}),
            contents: {
                text: {
                    maxCharacters: 1200,
                },
                highlights: {
                    query: language ? `${query} ${language}` : query,
                    maxCharacters: 400,
                },
            },
        })

        return searchResponse.results.map((result) => {
            const highlights = Array.isArray(result.highlights)
                ? result.highlights.filter(Boolean)
                : []
            const snippet =
                highlights[0] || result.text?.slice(0, 280) || result.url

            return {
                title: result.title || result.url,
                link: result.url,
                snippet,
                image: result.image || undefined,
                highlights: highlights.length > 0 ? highlights : undefined,
            }
        })
    }
}
