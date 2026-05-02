import {
    AIMessage,
    HumanMessage,
    SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenRouter } from '@langchain/openrouter'
import { inArray } from 'drizzle-orm'
import {
    createAgent,
    tool,
    toolCallLimitMiddleware,
    toolStrategy,
} from 'langchain'
import { z } from 'zod'

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
import type { SearchResultContext } from '@/lib/types/ai-metadata'

import { APIUsageService } from './api-usage-service'
import { SearchToolService } from './search-tool-service'

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

const platformSuggestionSchema = z.object({
    platform: z.string(),
    confidence: z.number().min(0).max(1),
    patterns: z.array(z.string()),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    icon: z.string(),
})

const titleSuggestionsSchema = z.object({
    suggestions: z
        .array(
            z.object({
                title: z.string(),
                confidence: z.number().min(0).max(1),
                source: z.string(),
                language: z
                    .string()
                    .describe(
                        'Language code of the title, e.g. "en", "zh-TW", "ja", "ko", or "unknown"',
                    ),
            }),
        )
        .min(1)
        .max(5),
    bestGuess: z.string(),
    alternatives: z.array(z.string()),
})

const searchWebToolSchema = z.object({
    query: z
        .string()
        .min(1)
        .describe('Search query used to find the canonical title for a URL'),
    domain: z
        .string()
        .optional()
        .describe('Optional domain restriction such as example.com'),
    language: z
        .string()
        .optional()
        .describe('Optional preferred language code such as en or zh-TW'),
    maxResults: z
        .number()
        .int()
        .min(1)
        .max(5)
        .optional()
        .describe('Maximum number of search results to fetch'),
})

const searchWebTool = tool(
    async ({ query, domain, language, maxResults }) => {
        const results = await SearchToolService.searchWeb({
            query,
            domain,
            language,
            maxResults,
        })

        return {
            results,
        }
    },
    {
        name: 'search_web',
        description:
            'Search the web for pages that can confirm a clean canonical video title and language variants.',
        schema: searchWebToolSchema,
    },
)

function collectAIMessageUsage(message: AIMessage): {
    prompt: number
    completion: number
    total: number
} {
    const usage = message.usage_metadata

    return {
        prompt: usage?.input_tokens || 0,
        completion: usage?.output_tokens || 0,
        total: usage?.total_tokens || 0,
    }
}

function sumUsage(messages: AIMessage[]): {
    prompt: number
    completion: number
    total: number
} {
    return messages.reduce(
        (totals, message) => {
            const usage = collectAIMessageUsage(message)

            return {
                prompt: totals.prompt + usage.prompt,
                completion: totals.completion + usage.completion,
                total: totals.total + usage.total,
            }
        },
        {
            prompt: 0,
            completion: 0,
            total: 0,
        },
    )
}

function extractMessageText(
    message: AIMessage | undefined,
): string | undefined {
    if (!message) {
        return undefined
    }

    if (typeof message.content === 'string') {
        return message.content
    }

    return JSON.stringify(message.content)
}

function isAIMessageWithText(message: unknown): message is AIMessage {
    return AIMessage.isInstance(message)
}

export class AIService {
    constructor() {
        if (!process.env.OPENROUTER_API_KEY) {
            throw new Error(
                'OPENROUTER_API_KEY environment variable is required',
            )
        }
    }

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

    private createChatModel(model: string): ChatOpenRouter {
        return new ChatOpenRouter({
            model,
            temperature: 0.2,
            siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            siteName: 'Video Watchlist App',
        })
    }

    async detectPlatform(url: string): Promise<PlatformSuggestion> {
        try {
            console.log('AI PLATFORM DETECTION: Analyzing URL:', url)

            const config = await this.getAIConfig()
            const modelName = config.modelId
            const model = this.createChatModel(modelName)
            const structuredModel = model.withStructuredOutput(
                platformSuggestionSchema,
                {
                    name: 'platform_suggestion',
                    method: 'functionCalling',
                    includeRaw: true,
                },
            )

            const userContent =
                config.platformDetection.userPromptTemplate.replace(
                    '{url}',
                    url,
                )

            const messages = [
                new SystemMessage(config.platformDetection.systemPrompt),
                new HumanMessage(userContent),
            ]

            const startTime = Date.now()
            const response = await structuredModel.invoke(messages)
            const durationMs = Date.now() - startTime

            const suggestion = response.parsed
            const raw = isAIMessageWithText(response.raw) ? response.raw : null

            console.log(
                'AI PLATFORM DETECTION: Successfully parsed structured response:',
                suggestion,
            )

            if (raw) {
                await APIUsageService.log(
                    'platform_detection',
                    collectAIMessageUsage(raw),
                    modelName,
                    JSON.stringify(messages, null, 2),
                    extractMessageText(raw),
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
        context: {
            searchResults?: SearchResultContext[]
            extractedMetadata?: Record<string, unknown>
            htmlSnippet?: string
            searchLanguages?: string[]
        } = {},
    ): Promise<TitleSuggestions & { searchResults: SearchResultContext[] }> {
        try {
            const aiConfig = await this.getAIConfig()
            const modelName = aiConfig.modelId
            const model = this.createChatModel(modelName)
            const agent = createAgent({
                model,
                tools: [searchWebTool],
                middleware: [
                    toolCallLimitMiddleware({
                        toolName: 'search_web',
                        runLimit: 2,
                        exitBehavior: 'error',
                    }),
                ],
                systemPrompt: aiConfig.titleSuggestion.systemPrompt,
                responseFormat: toolStrategy(titleSuggestionsSchema),
            })

            const seedSearchResults = context.searchResults || []
            const agentContext = {
                url: metadata.url,
                existingTitle: metadata.title,
                platform: metadata.platform,
                extractedMetadata: context.extractedMetadata,
                htmlSnippet: context.htmlSnippet,
                searchResults: seedSearchResults,
                ...(context.searchLanguages &&
                context.searchLanguages.length > 0
                    ? { searchLanguages: context.searchLanguages }
                    : {}),
            }

            console.log(
                'AI TITLE SUGGESTIONS: context:',
                JSON.stringify(agentContext, null, 2),
            )

            const userContent =
                aiConfig.titleSuggestion.userPromptTemplate.replace(
                    '{context}',
                    JSON.stringify(agentContext, null, 2),
                )
            const startTime = Date.now()
            const result = await agent.invoke({
                messages: [new HumanMessage(userContent)],
            })
            const durationMs = Date.now() - startTime

            const aiMessages = result.messages.filter(isAIMessageWithText)
            const structuredResponse = result.structuredResponse

            console.log(
                'AI TITLE SUGGESTIONS: Structured response:',
                JSON.stringify(structuredResponse, null, 2),
            )

            const searchResults = this.collectSearchResultsFromMessages(
                result.messages,
                seedSearchResults,
            )

            if (aiMessages.length > 0) {
                await APIUsageService.log(
                    'title_suggestion',
                    sumUsage(aiMessages),
                    modelName,
                    userContent,
                    JSON.stringify(structuredResponse, null, 2),
                    durationMs,
                )
            }

            return {
                ...structuredResponse,
                searchResults,
            }
        } catch (error) {
            console.error('AI TITLE SUGGESTIONS: Failed:', error)
            const fallbackTitle = metadata.title || 'Untitled Video'

            return {
                suggestions: [
                    {
                        title: fallbackTitle,
                        confidence: 0.5,
                        source: 'fallback',
                        language: 'unknown',
                    },
                ],
                bestGuess: fallbackTitle,
                alternatives: [],
                searchResults: context.searchResults || [],
            }
        }
    }

    private collectSearchResultsFromMessages(
        messages: Array<unknown>,
        fallbackResults: SearchResultContext[],
    ): SearchResultContext[] {
        for (const message of messages) {
            if (!message || typeof message !== 'object') {
                continue
            }

            const candidate = message as {
                name?: string
                content?: unknown
                getType?: () => string
            }

            if (
                candidate.getType?.() !== 'tool' ||
                candidate.name !== 'search_web'
            ) {
                continue
            }

            if (typeof candidate.content !== 'string') {
                continue
            }

            try {
                const parsed = JSON.parse(candidate.content) as {
                    results?: SearchResultContext[]
                }

                if (Array.isArray(parsed.results)) {
                    return parsed.results
                }
            } catch (error) {
                console.warn(
                    'AI TITLE SUGGESTIONS: Failed to parse search tool result:',
                    error,
                )
            }
        }

        return fallbackResults
    }
}

export const aiService = new AIService()
