export interface PlatformSuggestion {
    platform: string
    confidence: number
    patterns: string[]
    color: string
    icon: string
}

export interface TitleSuggestions {
    suggestions: Array<{
        title: string
        confidence: number
        source: string
        language: string
    }>
    bestGuess: string
    alternatives: string[]
}

// JSON Schemas for structured output
const platformSuggestionSchema = {
    type: 'object',
    properties: {
        platform: { type: 'string' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        patterns: { type: 'array', items: { type: 'string' } },
        color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        icon: { type: 'string' },
    },
    required: ['platform', 'confidence', 'patterns', 'color', 'icon'],
    additionalProperties: false,
}

const titleSuggestionsSchema = {
    type: 'object',
    properties: {
        suggestions: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    confidence: { type: 'number', minimum: 0, maximum: 1 },
                    source: { type: 'string' },
                    language: {
                        type: 'string',
                        description:
                            'Language code of the title, e.g. "en", "zh-TW", "ja", "ko", or "unknown"',
                    },
                },
                required: ['title', 'confidence', 'source', 'language'],
                additionalProperties: false,
            },
            minItems: 1,
            maxItems: 5,
        },
        bestGuess: { type: 'string' },
        alternatives: { type: 'array', items: { type: 'string' } },
    },
    required: ['suggestions', 'bestGuess', 'alternatives'],
    additionalProperties: false,
}

import { APIUsageService } from './api-usage-service'

const MODEL_NAME = 'arcee-ai/trinity-large-preview:free'

function extractMessages(body: unknown): string {
    const b = body as { messages?: Array<{ role: string; content: string }> }
    if (b.messages) {
        return JSON.stringify(b.messages)
    }
    return ''
}

export class AIService {
    private apiKey: string
    private baseUrl = 'https://openrouter.ai/api/v1'

    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY!
        if (!this.apiKey) {
            throw new Error(
                'OPENROUTER_API_KEY environment variable is required',
            )
        }
    }

    async detectPlatform(url: string): Promise<PlatformSuggestion> {
        try {
            console.log('🤖 AI PLATFORM DETECTION: Analyzing URL:', url)

            const requestBody = {
                model: MODEL_NAME,
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a helpful assistant that analyzes video URLs, metadatas, google search result. You can returns structured platform information. Always respond with valid JSON that matches the required schema.',
                    },
                    {
                        role: 'user',
                        content: `Analyze this URL and suggest platform details: ${url}`,
                    },
                ],
                provider: {
                    require_parameters: true,
                },
                response_format: {
                    type: 'json_schema',
                    json_schema: {
                        name: 'platform_suggestion',
                        schema: platformSuggestionSchema,
                        strict: true,
                    },
                },
            }

            const startTime = Date.now()
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            })
            const durationMs = Date.now() - startTime

            if (!response.ok) {
                console.log(
                    '🤖 AI PLATFORM DETECTION: API request failed with status:',
                    response.status,
                    response.statusText,
                )

                try {
                    const errorBody = await response.text()
                    console.log(
                        '🤖 AI PLATFORM DETECTION: Error response body:',
                        errorBody.substring(0, 500),
                    )
                } catch (bodyError) {
                    console.log(
                        '🤖 AI PLATFORM DETECTION: Could not read error response body:',
                        bodyError,
                    )
                }

                throw new Error(
                    `AI service error: ${response.status} ${response.statusText}`,
                )
            }

            const data = await response.json()
            console.log(
                '🤖 AI PLATFORM DETECTION: API response:',
                JSON.stringify(data, null, 2),
            )

            if (!data.choices?.[0]?.message?.content) {
                throw new Error('Invalid AI response format')
            }

            const suggestion: PlatformSuggestion = JSON.parse(
                data.choices[0].message.content,
            )

            if (
                !suggestion.platform ||
                typeof suggestion.confidence !== 'number' ||
                !Array.isArray(suggestion.patterns)
            ) {
                console.error(
                    '🤖 AI PLATFORM DETECTION: Invalid response structure:',
                    suggestion,
                )
                throw new Error('Invalid AI response structure')
            }

            console.log(
                '🤖 AI PLATFORM DETECTION: Successfully parsed structured response:',
                suggestion,
            )

            const usage = data.usage
            if (usage) {
                await APIUsageService.log(
                    'platform_detection',
                    {
                        prompt: usage.prompt_tokens || 0,
                        completion: usage.completion_tokens || 0,
                        total: usage.total_tokens || 0,
                    },
                    MODEL_NAME,
                    extractMessages(requestBody),
                    data.choices[0].message.content,
                    durationMs,
                )
            }

            return suggestion
        } catch (error) {
            console.error('🤖 AI PLATFORM DETECTION: Failed:', error)
            throw error
        }
    }

    async generateTitleSuggestions(
        metadata: { url?: string; title?: string; platform?: string },
        searchResults: unknown[] = [],
        languages?: string[],
    ): Promise<TitleSuggestions> {
        try {
            const context = {
                url: metadata.url,
                existingTitle: metadata.title,
                searchResults: searchResults,
                platform: metadata.platform,
                ...(languages && languages.length > 0
                    ? { searchLanguages: languages }
                    : {}),
            }
            console.log(
                '🤖 AI TITLE SUGGESTIONS: context:',
                JSON.stringify(context, null, 2),
            )

            const requestBody = {
                model: MODEL_NAME,
                temperature: 0.2,
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a video title extraction assistant. You analyze video page metadata, HTML tags, and Google search results to determine the actual video title. Metadata titles often contain extra text like site names, platform names, channel names, or decorative markers (e.g. "Video Title - SiteName", "Video Title | ChannelName - Platform"). Your job is to extract the clean video title, stripping away these suffixes and prefixes. When the same video title appears in multiple languages across the provided data, return each language variant as a separate suggestion. Do NOT translate titles — only return language variants you find evidence for in the data. Always respond with valid JSON matching the required schema.',
                    },
                    {
                        role: 'user',
                        content: `Analyze the context below and extract the actual video title(s).\n\nFor each title found:\n- Extract the clean video title, removing site names, platform suffixes, channel names, and decorative text (e.g. "Video Title - SiteName" should become "Video Title")\n- Identify the language code (e.g. "en", "zh-TW", "ja", "ko", or "unknown" if uncertain)\n- Rate your confidence (0-1) that this is the actual video title\n- Note the source where you found evidence (e.g. "og:title", "google search", "page title")\n\nRules:\n- Cross-reference metadata titles with Google search result titles to identify the common video title portion\n- Strip site names, platform names, channel names, and other suffixes/prefixes that are not part of the video title\n- Do NOT translate or fabricate titles not present in the data\n- Deduplicate titles that are identical after cleaning and trimming\n- If multiple languages are found in the data, return each as a separate suggestion\n- bestGuess should be the most likely clean video title\n\nContext:\n${JSON.stringify(context, null, 2)}`,
                    },
                ],
                provider: {
                    require_parameters: true,
                },
                response_format: {
                    type: 'json_schema',
                    json_schema: {
                        name: 'title_suggestions',
                        schema: titleSuggestionsSchema,
                        strict: true,
                    },
                },
            }

            const startTime = Date.now()
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer':
                        process.env.NEXT_PUBLIC_APP_URL ||
                        'http://localhost:3000',
                    'X-Title': 'Video Watchlist App',
                },
                body: JSON.stringify(requestBody),
            })
            const durationMs = Date.now() - startTime

            if (!response.ok) {
                console.log(
                    '🤖 AI TITLE SUGGESTIONS: API request failed with status:',
                    response.status,
                )

                try {
                    const errorBody = await response.text()
                    console.log(
                        '🤖 AI TITLE SUGGESTIONS: Error response body:',
                        errorBody.substring(0, 500),
                    )
                } catch (bodyError) {
                    console.log(
                        '🤖 AI TITLE SUGGESTIONS: Could not read error response body:',
                        bodyError,
                    )
                }

                throw new Error(`AI service error: ${response.status}`)
            }

            const data = await response.json()
            console.log(
                '🤖 AI TITLE SUGGESTIONS: API response:',
                JSON.stringify(data, null, 2),
            )

            if (!data.choices?.[0]?.message?.content) {
                throw new Error('Invalid AI response format')
            }

            const suggestions: TitleSuggestions = JSON.parse(
                data.choices[0].message.content,
            )

            if (
                !suggestions.suggestions ||
                !Array.isArray(suggestions.suggestions) ||
                suggestions.suggestions.length === 0
            ) {
                console.error(
                    '🤖 AI TITLE SUGGESTIONS: Invalid response structure:',
                    suggestions,
                )
                throw new Error('Invalid suggestions format')
            }

            console.log(
                '🤖 AI TITLE SUGGESTIONS: Successfully parsed structured response:',
                JSON.stringify(suggestions, null, 2),
            )

            const usage = data.usage
            if (usage) {
                await APIUsageService.log(
                    'title_suggestion',
                    {
                        prompt: usage.prompt_tokens || 0,
                        completion: usage.completion_tokens || 0,
                        total: usage.total_tokens || 0,
                    },
                    MODEL_NAME,
                    extractMessages(requestBody),
                    data.choices[0].message.content,
                    durationMs,
                )
            }

            return suggestions
        } catch (error) {
            console.error('🤖 AI TITLE SUGGESTIONS: Failed:', error)
            return {
                suggestions: [
                    {
                        title: metadata.title || 'Untitled Video',
                        confidence: 0.5,
                        source: 'fallback',
                        language: 'unknown',
                    },
                ],
                bestGuess: metadata.title || 'Untitled Video',
                alternatives: [],
            }
        }
    }
}

export const aiService = new AIService()
