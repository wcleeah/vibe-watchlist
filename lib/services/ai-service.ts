import { inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { userConfig } from '@/lib/db/schema'
import type { AIModelConfig, AIPromptConfig } from '@/lib/services/ai-config'
import {
    CONFIG_KEY_AI_MODEL,
    CONFIG_KEY_AI_PROMPT_PLATFORM_DETECTION,
    CONFIG_KEY_AI_PROMPT_TITLE_SUGGESTION,
    DEFAULT_MODEL_ID,
    DEFAULT_PLATFORM_DETECTION_SYSTEM_PROMPT,
    DEFAULT_PLATFORM_DETECTION_USER_PROMPT_TEMPLATE,
    DEFAULT_TITLE_SUGGESTION_SYSTEM_PROMPT,
    DEFAULT_TITLE_SUGGESTION_USER_PROMPT_TEMPLATE,
} from '@/lib/services/ai-config'
import { APIUsageService } from './api-usage-service'

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

// ── JSON Schemas for structured output ──────────────────────────────────────

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

// ── Helpers ─────────────────────────────────────────────────────────────────

function extractMessages(body: unknown): string {
    const b = body as { messages?: Array<{ role: string; content: string }> }
    if (b.messages) {
        return JSON.stringify(b.messages)
    }
    return ''
}

// ── AIService ───────────────────────────────────────────────────────────────

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

    /**
     * Fetch all AI-related config from user_config in one query.
     * Falls back to exported defaults when no DB config exists.
     */
    private async getAIConfig(): Promise<{
        modelId: string
        platformDetection: AIPromptConfig
        titleSuggestion: AIPromptConfig
    }> {
        const defaults = {
            modelId: DEFAULT_MODEL_ID,
            platformDetection: {
                systemPrompt: DEFAULT_PLATFORM_DETECTION_SYSTEM_PROMPT,
                userPromptTemplate:
                    DEFAULT_PLATFORM_DETECTION_USER_PROMPT_TEMPLATE,
            },
            titleSuggestion: {
                systemPrompt: DEFAULT_TITLE_SUGGESTION_SYSTEM_PROMPT,
                userPromptTemplate:
                    DEFAULT_TITLE_SUGGESTION_USER_PROMPT_TEMPLATE,
            },
        }

        try {
            const configs = await db
                .select()
                .from(userConfig)
                .where(
                    inArray(userConfig.configKey, [
                        CONFIG_KEY_AI_MODEL,
                        CONFIG_KEY_AI_PROMPT_PLATFORM_DETECTION,
                        CONFIG_KEY_AI_PROMPT_TITLE_SUGGESTION,
                    ]),
                )

            for (const config of configs) {
                switch (config.configKey) {
                    case CONFIG_KEY_AI_MODEL: {
                        const val = config.configValue as AIModelConfig
                        if (val?.modelId) {
                            defaults.modelId = val.modelId
                        }
                        break
                    }
                    case CONFIG_KEY_AI_PROMPT_PLATFORM_DETECTION: {
                        const val = config.configValue as AIPromptConfig
                        if (val?.systemPrompt) {
                            defaults.platformDetection.systemPrompt =
                                val.systemPrompt
                        }
                        if (val?.userPromptTemplate) {
                            defaults.platformDetection.userPromptTemplate =
                                val.userPromptTemplate
                        }
                        break
                    }
                    case CONFIG_KEY_AI_PROMPT_TITLE_SUGGESTION: {
                        const val = config.configValue as AIPromptConfig
                        if (val?.systemPrompt) {
                            defaults.titleSuggestion.systemPrompt =
                                val.systemPrompt
                        }
                        if (val?.userPromptTemplate) {
                            defaults.titleSuggestion.userPromptTemplate =
                                val.userPromptTemplate
                        }
                        break
                    }
                }
            }
        } catch {
            console.warn('AIService: Could not fetch AI config, using defaults')
        }

        return defaults
    }

    async detectPlatform(url: string): Promise<PlatformSuggestion> {
        try {
            console.log('AI PLATFORM DETECTION: Analyzing URL:', url)

            const config = await this.getAIConfig()
            const modelName = config.modelId
            const userContent =
                config.platformDetection.userPromptTemplate.replace(
                    '{url}',
                    url,
                )

            const requestBody = {
                model: modelName,
                messages: [
                    {
                        role: 'system',
                        content: config.platformDetection.systemPrompt,
                    },
                    {
                        role: 'user',
                        content: userContent,
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
                    'AI PLATFORM DETECTION: API request failed with status:',
                    response.status,
                    response.statusText,
                )

                try {
                    const errorBody = await response.text()
                    console.log(
                        'AI PLATFORM DETECTION: Error response body:',
                        errorBody.substring(0, 500),
                    )
                } catch (bodyError) {
                    console.log(
                        'AI PLATFORM DETECTION: Could not read error response body:',
                        bodyError,
                    )
                }

                throw new Error(
                    `AI service error: ${response.status} ${response.statusText}`,
                )
            }

            const data = await response.json()
            console.log(
                'AI PLATFORM DETECTION: API response:',
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
                    'AI PLATFORM DETECTION: Invalid response structure:',
                    suggestion,
                )
                throw new Error('Invalid AI response structure')
            }

            console.log(
                'AI PLATFORM DETECTION: Successfully parsed structured response:',
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
                    modelName,
                    extractMessages(requestBody),
                    data.choices[0].message.content,
                    durationMs,
                )
            }

            return suggestion
        } catch (error) {
            console.error('AI PLATFORM DETECTION: Failed:', error)
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
                'AI TITLE SUGGESTIONS: context:',
                JSON.stringify(context, null, 2),
            )

            const aiConfig = await this.getAIConfig()
            const modelName = aiConfig.modelId
            const userContent =
                aiConfig.titleSuggestion.userPromptTemplate.replace(
                    '{context}',
                    JSON.stringify(context, null, 2),
                )

            const requestBody = {
                model: modelName,
                temperature: 0.2,
                messages: [
                    {
                        role: 'system',
                        content: aiConfig.titleSuggestion.systemPrompt,
                    },
                    {
                        role: 'user',
                        content: userContent,
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
                    'AI TITLE SUGGESTIONS: API request failed with status:',
                    response.status,
                )

                try {
                    const errorBody = await response.text()
                    console.log(
                        'AI TITLE SUGGESTIONS: Error response body:',
                        errorBody.substring(0, 500),
                    )
                } catch (bodyError) {
                    console.log(
                        'AI TITLE SUGGESTIONS: Could not read error response body:',
                        bodyError,
                    )
                }

                throw new Error(`AI service error: ${response.status}`)
            }

            const data = await response.json()
            console.log(
                'AI TITLE SUGGESTIONS: API response:',
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
                    'AI TITLE SUGGESTIONS: Invalid response structure:',
                    suggestions,
                )
                throw new Error('Invalid suggestions format')
            }

            console.log(
                'AI TITLE SUGGESTIONS: Successfully parsed structured response:',
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
                    modelName,
                    extractMessages(requestBody),
                    data.choices[0].message.content,
                    durationMs,
                )
            }

            return suggestions
        } catch (error) {
            console.error('AI TITLE SUGGESTIONS: Failed:', error)
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
