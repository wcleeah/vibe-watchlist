'use client'

import { useCallback, useEffect, useState } from 'react'

import { SeriesService } from '@/lib/services/series-service'
import type { SeriesFilters, SeriesWithTags } from '@/types/series'

interface UseSeriesReturn {
    series: SeriesWithTags[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    markWatched: (id: number) => Promise<void>
    deleteSeries: (id: number) => Promise<void>
}

interface UseSeriesOptions {
    filters?: SeriesFilters
    autoFetch?: boolean
}

/**
 * Hook for fetching and managing series data in frontend components
 */
export function useSeries(options: UseSeriesOptions = {}): UseSeriesReturn {
    const { filters, autoFetch = true } = options

    const [series, setSeries] = useState<SeriesWithTags[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchSeries = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const data = await SeriesService.getAll(filters)
            setSeries(data)
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to fetch series',
            )
            console.error('Failed to fetch series:', err)
        } finally {
            setLoading(false)
        }
    }, [filters])

    const markWatched = useCallback(
        async (id: number) => {
            try {
                await SeriesService.markWatched(id)
                // Optimistically update the local state
                setSeries((prev) =>
                    prev.map((s) =>
                        s.id === id
                            ? {
                                  ...s,
                                  missedPeriods: 0,
                                  lastWatchedAt: new Date(),
                              }
                            : s,
                    ),
                )
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to mark as watched',
                )
                console.error('Failed to mark series as watched:', err)
                // Refetch to ensure consistent state
                await fetchSeries()
            }
        },
        [fetchSeries],
    )

    const deleteSeries = useCallback(
        async (id: number) => {
            try {
                await SeriesService.delete(id)
                // Optimistically remove from local state
                setSeries((prev) => prev.filter((s) => s.id !== id))
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to delete series',
                )
                console.error('Failed to delete series:', err)
                // Refetch to ensure consistent state
                await fetchSeries()
            }
        },
        [fetchSeries],
    )

    useEffect(() => {
        if (autoFetch) {
            fetchSeries()
        }
    }, [autoFetch, fetchSeries])

    return {
        series,
        loading,
        error,
        refetch: fetchSeries,
        markWatched,
        deleteSeries,
    }
}
