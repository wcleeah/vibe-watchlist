import { awaitAllCallbacks } from '@langchain/core/callbacks/promises'
import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { ChatOpenRouter } from '@langchain/openrouter'
import { inArray } from 'drizzle-orm'
import { createAgent, toolStrategy } from 'langchain'
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

import { APIUsageService } from './api-usage-service'
import { getExaTools } from './exa-mcp-service'

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

function isAIMessageWithText(message: unknown): message is AIMessage {
    return AIMessage.isInstance(message)
}

async function flushTracingCallbacks(): Promise<void> {
    try {
        await awaitAllCallbacks()
    } catch (error) {
        console.warn('AIService: Failed to flush tracing callbacks', error)
    }
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
            const tools = await getExaTools()
            const agent = createAgent({
                model,
                tools,
                systemPrompt: [
                    config.platformDetection.systemPrompt,
                    'Use the available Exa web tools to identify unfamiliar domains, confirm the hosting platform, and gather external evidence for the patterns you return whenever that improves confidence.',
                ].join(' '),
                responseFormat: toolStrategy(platformSuggestionSchema),
            })

            const userContent = `${config.platformDetection.userPromptTemplate.replace(
                '{url}',
                url,
            )}\n\nUse the available Exa web tools whenever outside evidence helps identify or confirm the platform.`

            const startTime = Date.now()
            const result = await agent.invoke({
                messages: [new HumanMessage(userContent)],
            })
            const durationMs = Date.now() - startTime
            await flushTracingCallbacks()

            const aiMessages = result.messages.filter(isAIMessageWithText)
            const suggestion = result.structuredResponse

            console.log(
                'AI PLATFORM DETECTION: Successfully parsed structured response:',
                suggestion,
            )

            if (aiMessages.length > 0) {
                await APIUsageService.log(
                    'platform_detection',
                    sumUsage(aiMessages),
                    modelName,
                    userContent,
                    JSON.stringify(suggestion, null, 2),
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
            extractedMetadata?: Record<string, unknown>
            htmlSnippet?: string
            searchLanguages?: string[]
        } = {},
    ): Promise<TitleSuggestions> {
        try {
            const aiConfig = await this.getAIConfig()
            const modelName = aiConfig.modelId
            const model = this.createChatModel(modelName)
            const tools = await getExaTools()
            const agent = createAgent({
                model,
                tools,
                systemPrompt: aiConfig.titleSuggestion.systemPrompt,
                responseFormat: toolStrategy(titleSuggestionsSchema),
            })

            const agentContext = {
                url: metadata.url,
                existingTitle: metadata.title,
                platform: metadata.platform,
                extractedMetadata: context.extractedMetadata,
                htmlSnippet: context.htmlSnippet,
                ...(context.searchLanguages &&
                context.searchLanguages.length > 0
                    ? { searchLanguages: context.searchLanguages }
                    : {}),
            }

            console.log(
                'AI TITLE SUGGESTIONS: context:',
                JSON.stringify(agentContext, null, 2),
            )

            const userContent = `${aiConfig.titleSuggestion.userPromptTemplate.replace(
                '{context}',
                JSON.stringify(agentContext, null, 2),
            )}\n\nIf Chinese-language titles may exist, actively use Exa to look for zh-Hant, zh-HK, and zh-TW variants before finalizing the result.`
            const startTime = Date.now()
            const result = await agent.invoke({
                messages: [new HumanMessage(userContent)],
            })
            const durationMs = Date.now() - startTime
            await flushTracingCallbacks()

            const aiMessages = result.messages.filter(isAIMessageWithText)
            const structuredResponse = result.structuredResponse

            console.log(
                'AI TITLE SUGGESTIONS: Structured response:',
                JSON.stringify(structuredResponse, null, 2),
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

            return structuredResponse
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
            }
        }
    }
}

export const aiService = new AIService()
