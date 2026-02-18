'use client'

import { useCallback, useEffect, useState } from 'react'
import type {
    MetadataExtractionResponse,
    MetadataSuggestion,
} from '@/lib/types/ai-metadata'
import type { UrlValidationResult } from './use-url-validation.js'

export interface UseAIMetadataFetchingReturn {
    suggestions: MetadataSuggestion[]
    fallback: { title?: string; thumbnailUrl?: string } | null
    fetchDone: boolean
    error: string | null
    selectedSuggestion?: MetadataSuggestion
    setSelectedSuggestion: (suggestion: MetadataSuggestion | undefined) => void
    updateSuggestionsPlatform: (platform: string) => void
}

export function useAIMetadataFetching(
    urlValidationResult: UrlValidationResult | undefined,
): UseAIMetadataFetchingReturn {
    const [suggestions, setSuggestions] = useState<MetadataSuggestion[]>([])
    const [fallback, setFallback] = useState<{
        title?: string
        thumbnailUrl?: string
    } | null>(null)
    const [fetchDone, setFetchDone] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedSuggestion, setSelectedSuggestion] = useState<
        MetadataSuggestion | undefined
    >()

    useEffect(() => {
        if (!urlValidationResult || !urlValidationResult.isValid) {
            setSuggestions([])
            setFallback(null)
            setError(null)
            setSelectedSuggestion(undefined)
            setFetchDone(false)
            return
        }

        setFetchDone(false)
        setError(null)

        fetch('/api/metadata/extract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: urlValidationResult.url,
                platform: urlValidationResult.platform,
            }),
        })
            .then((response) => {
                return response.json()
            })
            .then((result: MetadataExtractionResponse) => {
                setSuggestions(result.suggestions)
                setFallback(
                    result.fallback
                        ? {
                              title: result.fallback.title,
                              thumbnailUrl:
                                  result.fallback.thumbnailUrl || undefined,
                          }
                        : null,
                )

                if (result.suggestions.length > 0) {
                    const bestSuggestion = result.suggestions.reduce(
                        (best, current) =>
                            current.confidence > best.confidence
                                ? current
                                : best,
                    )
                    setSelectedSuggestion(bestSuggestion)
                } else {
                    setSelectedSuggestion(undefined)
                }
                setFetchDone(true)
            })
            .catch((err) => {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to fetch AI metadata'
                setError(errorMessage)
                setSuggestions([])
                setFallback(null)
                setSelectedSuggestion(undefined)
                console.error('AI metadata fetch failed:', err)
            })
    }, [urlValidationResult])

    const updateSuggestionsPlatform = useCallback((platform: string) => {
        setSuggestions((prev) => {
            if (prev.length > 0 && prev[0].platform === platform) {
                return prev
            }
            return prev.map((s) => ({ ...s, platform }))
        })
        setSelectedSuggestion((prev) => {
            if (!prev || prev.platform === platform) return prev
            return { ...prev, platform }
        })
    }, [])

    return {
        suggestions,
        fallback,
        fetchDone,
        error,
        selectedSuggestion,
        setSelectedSuggestion,
        updateSuggestionsPlatform,
    }
}
