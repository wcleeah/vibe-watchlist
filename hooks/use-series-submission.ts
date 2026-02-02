'use client'

import { useCallback, useState } from 'react'

import { SeriesService } from '@/lib/services/series-service'
import type { ScheduleType, ScheduleValue } from '@/types/series'

interface SeriesSubmissionData {
    url: string
    title: string
    platform: string
    thumbnailUrl?: string
    scheduleType: ScheduleType
    scheduleValue: ScheduleValue
    startDate: string
    endDate?: string
    tagIds: number[]
    totalEpisodes?: number
}

interface UseSeriesSubmissionOptions {
    onSuccess?: () => void
    onReset?: () => void
}

interface UseSeriesSubmissionReturn {
    isSubmitting: boolean
    error: string | null
    submit: (
        data: SeriesSubmissionData,
        saveAsDefault?: boolean,
    ) => Promise<void>
    clearError: () => void
}

/**
 * Hook for managing series creation submission
 */
export function useSeriesSubmission(
    options: UseSeriesSubmissionOptions = {},
): UseSeriesSubmissionReturn {
    const { onSuccess, onReset } = options

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const submit = useCallback(
        async (data: SeriesSubmissionData, saveAsDefault = false) => {
            setError(null)
            setIsSubmitting(true)

            try {
                await SeriesService.create({
                    url: data.url,
                    title: data.title,
                    platform: data.platform || 'unknown',
                    thumbnailUrl: data.thumbnailUrl,
                    scheduleType: data.scheduleType,
                    scheduleValue: data.scheduleValue,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    tagIds: data.tagIds,
                    totalEpisodes: data.totalEpisodes,
                })

                // Save as default mode for platform if checked
                if (saveAsDefault && data.platform) {
                    try {
                        await fetch('/api/platforms/default-mode', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                platformId: data.platform,
                                defaultMode: 'series',
                            }),
                        })
                    } catch (err) {
                        console.error('Failed to save default mode:', err)
                    }
                }

                onSuccess?.()
                onReset?.()
            } catch (err) {
                console.error('Failed to create series:', err)
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to create series',
                )
            } finally {
                setIsSubmitting(false)
            }
        },
        [onSuccess, onReset],
    )

    const clearError = useCallback(() => {
        setError(null)
    }, [])

    return {
        isSubmitting,
        error,
        submit,
        clearError,
    }
}
