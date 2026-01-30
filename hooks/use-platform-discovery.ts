'use client'

import { useEffect, useState } from 'react'
import { PLATFORM_CONFIDENCE_THRESHOLD } from '@/lib/constants/form'
import type { PlatformSuggestion } from '@/lib/services/ai-service'
import type { UrlValidationResult } from './use-url-validation'

interface UsePlatformDiscoveryReturn {
    suggestions: PlatformSuggestion[]
    isProcessed: boolean
    dismiss: () => void
}

export function usePlatformDiscovery(
    urlValidationResult: UrlValidationResult | undefined,
): UsePlatformDiscoveryReturn {
    const [suggestions, setSuggestions] = useState<PlatformSuggestion[]>([])
    const [isProcessed, setIsProcessed] = useState(false)

    useEffect(() => {
        // Reset on URL change
        setSuggestions([])
        setIsProcessed(false)

        if (
            !urlValidationResult?.validated ||
            !urlValidationResult.isValid ||
            urlValidationResult.platform !== 'unknown'
        ) {
            setIsProcessed(true)
            return
        }

        const controller = new AbortController()

        fetch('/api/platforms/discover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: urlValidationResult.url }),
            signal: controller.signal,
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`API request failed: ${response.status}`)
                }
                return response.json()
            })
            .then((data) => {
                const suggestion: PlatformSuggestion = data.suggestion
                if (suggestion?.confidence > PLATFORM_CONFIDENCE_THRESHOLD) {
                    setSuggestions([suggestion])
                }
            })
            .catch((error) => {
                if (error.name !== 'AbortError') {
                    // Silently handle platform discovery errors
                }
            })
            .finally(() => {
                setIsProcessed(true)
            })

        return () => controller.abort()
    }, [
        urlValidationResult?.url,
        urlValidationResult?.validated,
        urlValidationResult?.isValid,
        urlValidationResult?.platform,
    ])

    const dismiss = () => {
        setSuggestions([])
    }

    return { suggestions, isProcessed, dismiss }
}
