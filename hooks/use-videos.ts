'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { VideoFilters, VideoWithTags } from '@/types/video'

interface UseVideosReturn {
    videos: VideoWithTags[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    markWatched: (id: number) => Promise<void>
    markUnwatched: (id: number) => Promise<void>
    deleteVideo: (id: number) => Promise<void>
    reorderVideos: (orderedIds: number[]) => Promise<void>
}

interface UseVideosOptions {
    filters?: VideoFilters
    autoFetch?: boolean
}

/**
 * Hook for fetching and managing video data in frontend components
 */
export function useVideos(options: UseVideosOptions = {}): UseVideosReturn {
    const { filters, autoFetch = true } = options

    const [videos, setVideos] = useState<VideoWithTags[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchVideos = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const params = new URLSearchParams()

            // Add watched filter
            if (filters?.isWatched !== undefined) {
                params.set('watched', filters.isWatched.toString())
            }

            // Add search query
            if (filters?.search?.trim()) {
                params.set('search', filters.search.trim())
            }

            // Add platform filters
            if (filters?.platforms && filters.platforms.length > 0) {
                params.set('platforms', filters.platforms.join(','))
            }

            // Add tag filters
            if (filters?.tagIds && filters.tagIds.length > 0) {
                params.set('tags', filters.tagIds.join(','))
            }

            // Add sorting
            if (filters?.sortBy) {
                params.set('sortBy', filters.sortBy)
            }
            if (filters?.sortOrder) {
                params.set('sortOrder', filters.sortOrder)
            }

            const response = await fetch(`/api/videos?${params.toString()}`)
            if (response.ok) {
                const data = await response.json()
                setVideos(data)
            } else {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to fetch videos')
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to fetch videos',
            )
            console.error('Failed to fetch videos:', err)
        } finally {
            setLoading(false)
        }
    }, [filters])

    // Mark video as watched
    const markWatched = useCallback(
        async (id: number) => {
            try {
                const response = await fetch(`/api/videos/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isWatched: true }),
                })

                if (response.ok) {
                    // Remove from list (will move to watched)
                    setVideos((prev) => prev.filter((v) => v.id !== id))
                    toast.success('Video marked as watched')
                } else {
                    const errorData = await response.json()
                    throw new Error(
                        errorData.error || 'Failed to mark as watched',
                    )
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to mark as watched',
                )
                console.error('Failed to mark video as watched:', err)
                await fetchVideos()
            }
        },
        [fetchVideos],
    )

    // Mark video as unwatched
    const markUnwatched = useCallback(
        async (id: number) => {
            try {
                const response = await fetch(`/api/videos/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isWatched: false }),
                })

                if (response.ok) {
                    // Remove from list (will move to active)
                    setVideos((prev) => prev.filter((v) => v.id !== id))
                    toast.success('Video marked as unwatched')
                } else {
                    const errorData = await response.json()
                    throw new Error(
                        errorData.error || 'Failed to mark as unwatched',
                    )
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to mark as unwatched',
                )
                console.error('Failed to mark video as unwatched:', err)
                await fetchVideos()
            }
        },
        [fetchVideos],
    )

    // Delete video
    const deleteVideo = useCallback(
        async (id: number) => {
            try {
                const response = await fetch(`/api/videos/${id}`, {
                    method: 'DELETE',
                })

                if (response.ok) {
                    // Remove from list
                    setVideos((prev) => prev.filter((v) => v.id !== id))
                    toast.success('Video deleted')
                } else {
                    const errorData = await response.json()
                    throw new Error(errorData.error || 'Failed to delete video')
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to delete video',
                )
                console.error('Failed to delete video:', err)
                await fetchVideos()
            }
        },
        [fetchVideos],
    )

    // Reorder videos - update sortOrder in database
    const reorderVideos = useCallback(
        async (orderedIds: number[]) => {
            const response = await fetch('/api/videos/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderedIds }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to reorder videos')
            }

            // Refetch to get updated order
            await fetchVideos()
        },
        [fetchVideos],
    )

    useEffect(() => {
        if (autoFetch) {
            fetchVideos()
        }
    }, [autoFetch, fetchVideos])

    return {
        videos,
        loading,
        error,
        refetch: fetchVideos,
        markWatched,
        markUnwatched,
        deleteVideo,
        reorderVideos,
    }
}
