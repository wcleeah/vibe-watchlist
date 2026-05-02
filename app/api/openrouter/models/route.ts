import { NextResponse } from 'next/server'

export interface OpenRouterModel {
    id: string
    name: string
    description: string
    contextLength: number | null
    pricing: {
        prompt: string
        completion: string
    }
}

interface OpenRouterAPIModel {
    id: string
    name: string
    description?: string
    context_length: number | null
    architecture?: {
        input_modalities?: string[]
        output_modalities?: string[]
    }
    supported_parameters?: string[]
    pricing?: {
        prompt?: string
        completion?: string
    }
}

// Simple in-memory cache
let cachedModels: OpenRouterModel[] | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function GET() {
    try {
        const now = Date.now()

        // Return cached data if still fresh
        if (cachedModels && now - cacheTimestamp < CACHE_TTL_MS) {
            return NextResponse.json({
                success: true,
                data: cachedModels,
            })
        }

        const apiKey = process.env.OPENROUTER_API_KEY
        if (!apiKey) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'OPENROUTER_API_KEY is not configured',
                },
                { status: 500 },
            )
        }

        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        })

        if (!response.ok) {
            return NextResponse.json(
                {
                    success: false,
                    error: `OpenRouter API error: ${response.status}`,
                },
                { status: response.status },
            )
        }

        const data = (await response.json()) as {
            data: OpenRouterAPIModel[]
        }

        // Filter: text input + text output + tool calling support
        const filtered = data.data.filter((model) => {
            const input = model.architecture?.input_modalities ?? []
            const output = model.architecture?.output_modalities ?? []
            const params = model.supported_parameters ?? []
            return (
                input.includes('text') &&
                output.includes('text') &&
                params.includes('tools')
            )
        })

        // Map to simplified shape
        const models: OpenRouterModel[] = filtered.map((model) => ({
            id: model.id,
            name: model.name,
            description: model.description ?? '',
            contextLength: model.context_length,
            pricing: {
                prompt: model.pricing?.prompt ?? '0',
                completion: model.pricing?.completion ?? '0',
            },
        }))

        // Sort: free models first (by context desc), then paid (by price asc)
        models.sort((a, b) => {
            const aFree =
                Number(a.pricing.prompt) === 0 &&
                Number(a.pricing.completion) === 0
            const bFree =
                Number(b.pricing.prompt) === 0 &&
                Number(b.pricing.completion) === 0

            if (aFree !== bFree) return aFree ? -1 : 1

            // Free models: sort by context length descending
            if (aFree) {
                return (b.contextLength ?? 0) - (a.contextLength ?? 0)
            }

            // Paid models: sort by prompt price ascending
            return Number(a.pricing.prompt) - Number(b.pricing.prompt)
        })

        // Update cache
        cachedModels = models
        cacheTimestamp = now

        return NextResponse.json({ success: true, data: models })
    } catch (error) {
        console.error('Failed to fetch OpenRouter models:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch models' },
            { status: 500 },
        )
    }
}
