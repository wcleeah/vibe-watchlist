'use client'

import { useCallback, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import type { VideoFormData } from '@/types/form'
import type { UrlValidationResult } from './use-url-validation'

interface UseVideoSubmissionReturn {
    isSubmitting: boolean
    error: string | null
    submit: (data: VideoFormData) => Promise<void>
    resetError: () => void
}

interface UseVideoSubmissionOptions {
    onSuccess?: () => void
}

export function useVideoSubmission(
    form: UseFormReturn<VideoFormData>,
    urlValidationResult: UrlValidationResult | undefined,
    options?: UseVideoSubmissionOptions,
): UseVideoSubmissionReturn {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const submit = useCallback(
        async (data: VideoFormData) => {
            if (!urlValidationResult?.isValid) return

            setIsSubmitting(true)
            setError(null)

            try {
                const videoData = {
                    url: data.url,
                    title: data.title,
                    platform: data.platform,
                    thumbnailUrl: data.thumbnailUrl || null,
                    tagIds: data.tags,
                }

                const response = await fetch('/api/videos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(videoData),
                })

                if (!response.ok) {
                    if (response.status === 409) {
                        const errorData = await response.json()
                        setError(errorData.error || 'Video already exists')
                    } else {
                        setError('Failed to add video')
                    }
                    return
                }

                toast.success('Video added successfully!')
                options?.onSuccess?.()
            } catch {
                setError('Failed to add video')
            } finally {
                setIsSubmitting(false)
            }
        },
        [urlValidationResult?.isValid, options],
    )

    const resetError = useCallback(() => {
        setError(null)
    }, [])

    return {
        isSubmitting,
        error,
        submit,
        resetError,
    }
}
