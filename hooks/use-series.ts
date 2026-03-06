'use client'

import { useCallback, useEffect, useState } from 'react'

import { SeriesService } from '@/lib/services/series-service'
import type { SeriesFilters, SeriesWithTags } from '@/types/series'
import { computeEpisodeFields } from '@/types/series'

interface UseSeriesReturn {
    series: SeriesWithTags[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    catchUp: (id: number) => Promise<void>
    markWatched: (id: number) => Promise<void>
    unmarkWatched: (id: number) => Promise<void>
    incrementProgress: (id: number) => Promise<boolean>
    deleteSeries: (id: number) => Promise<void>
    reorderSeries: (orderedIds: number[]) => Promise<void>
    triggerUpdate: () => Promise<void>
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

    // Catch up - set watched = aired for recurring series
    const catchUp = useCallback(
        async (id: number) => {
            try {
                await SeriesService.catchUp(id)
                // Optimistically update the local state
                setSeries((prev) =>
                    prev.map((s) =>
                        s.id === id
                            ? {
                                  ...s,
                                  episodesWatched: s.episodesAired,
                                  lastWatchedAt: new Date(),
                              }
                            : s,
                    ),
                )
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'Failed to catch up',
                )
                console.error('Failed to catch up on series:', err)
                // Refetch to ensure consistent state
                await fetchSeries()
            }
        },
        [fetchSeries],
    )

    // Mark as watched - move to Watched tab
    const markWatched = useCallback(
        async (id: number) => {
            try {
                await SeriesService.markWatched(id)
                // Remove from current list (will move to Watched tab)
                setSeries((prev) => prev.filter((s) => s.id !== id))
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to mark as watched',
                )
                console.error('Failed to mark series as watched:', err)
                await fetchSeries()
            }
        },
        [fetchSeries],
    )

    // Unmark watched - move back to Active tab
    const unmarkWatched = useCallback(
        async (id: number) => {
            try {
                await SeriesService.unmarkWatched(id)
                // Remove from current list (will move to Active tab)
                setSeries((prev) => prev.filter((s) => s.id !== id))
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to unmark as watched',
                )
                console.error('Failed to unmark series as watched:', err)
                await fetchSeries()
            }
        },
        [fetchSeries],
    )

    // Increment progress - returns true if series is now complete
    const incrementProgress = useCallback(
        async (id: number): Promise<boolean> => {
            try {
                const result = await SeriesService.incrementProgress(id)
                // Optimistically update the local state
                setSeries((prev) =>
                    prev.map((s) =>
                        s.id === id
                            ? {
                                  ...s,
                                  episodesWatched: result.episodesWatched,
                              }
                            : s,
                    ),
                )
                // Return whether series is now complete
                const { episodesTotal } = computeEpisodeFields(result)
                if (
                    episodesTotal > 0 &&
                    result.episodesWatched >= episodesTotal
                ) {
                    return true
                }
                return false
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to increment progress',
                )
                console.error('Failed to increment progress:', err)
                await fetchSeries()
                return false
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

    // Reorder series - update sortOrder in database
    const reorderSeries = useCallback(async (orderedIds: number[]) => {
        const response = await fetch('/api/series/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderedIds }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to reorder series')
        }

        // Update local state with new order to keep in sync
        setSeries((prev) => {
            const seriesMap = new Map(prev.map((s) => [s.id, s]))
            return orderedIds
                .map((id) => seriesMap.get(id))
                .filter((s): s is SeriesWithTags => s !== undefined)
        })
    }, [])

    // Trigger manual series update
    const triggerUpdate = useCallback(async () => {
        try {
            await SeriesService.triggerUpdate()
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to trigger series update',
            )
            console.error('Failed to trigger series update:', err)
            throw err
        }
    }, [])

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
        catchUp,
        markWatched,
        unmarkWatched,
        incrementProgress,
        deleteSeries,
        reorderSeries,
        triggerUpdate,
    }
}
