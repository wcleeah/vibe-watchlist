'use client'

import { useCallback, useState } from 'react'
import { URL_DEBOUNCE_MS } from '@/lib/constants/form'
import { type ParsedUrl, parseVideoUrlClient } from '@/lib/utils/url-parser'
import { useDebouncedCallback } from './use-debounce'

export interface UseUrlValidationReturn {
    setUrl: (url: string) => void
    unsetUrl: () => void
    urlValidationResult?: UrlValidationResult
    validating: boolean
}

export type UrlValidationResult = ParsedUrl & {
    validated: boolean
}

export function useUrlValidation(): UseUrlValidationReturn {
    const [urlValidationResult, setUrlValidationResult] = useState<
        UrlValidationResult | undefined
    >(undefined)
    const [validating, setValidating] = useState(false)

    const debouncedSetUrl = useDebouncedCallback(async (newUrl: string) => {
        const trimmed = newUrl.trim()
        if (!trimmed) {
            setUrlValidationResult(undefined)
            setValidating(false)
            return
        }

        const parsed = await parseVideoUrlClient(trimmed)
        setUrlValidationResult({
            ...parsed,
            validated: true,
        })
        setValidating(false)
    }, URL_DEBOUNCE_MS)

    const setUrl = useCallback(
        (newUrl: string) => {
            setValidating(true)
            debouncedSetUrl(newUrl)
        },
        [debouncedSetUrl],
    )

    const unsetUrl = useCallback(() => {
        setUrlValidationResult(undefined)
        setValidating(false)
    }, [])

    return {
        setUrl,
        unsetUrl,
        urlValidationResult,
        validating,
    }
}
