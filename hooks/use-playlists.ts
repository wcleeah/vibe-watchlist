'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { PlaylistFilters, PlaylistSummary } from '@/types/playlist'

interface UsePlaylistsReturn {
    playlists: PlaylistSummary[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    sync: (id: number) => Promise<void>
    deletePlaylist: (id: number) => Promise<void>
    markCompleted: (id: number) => Promise<void>
    unmarkCompleted: (id: number) => Promise<void>
}

interface UsePlaylistsOptions {
    filters?: PlaylistFilters
    autoFetch?: boolean
}

/**
 * Hook for fetching and managing playlist data in frontend components
 */
export function usePlaylists(
    options: UsePlaylistsOptions = {},
): UsePlaylistsReturn {
    const { filters, autoFetch = true } = options

    const [playlists, setPlaylists] = useState<PlaylistSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPlaylists = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const params = new URLSearchParams()

            // Add search query
            if (filters?.search?.trim()) {
                params.set('search', filters.search.trim())
            }

            // Add status filter
            if (filters?.status && filters.status !== 'all') {
                params.set('status', filters.status)
            }

            // Add isCompleted filter
            if (filters?.isCompleted !== undefined) {
                params.set('isCompleted', filters.isCompleted.toString())
            }

            // Add platform filter
            if (filters?.platform?.trim()) {
                params.set('platform', filters.platform.trim())
            }

            // Add tag IDs filter
            if (filters?.tagIds && filters.tagIds.length > 0) {
                params.set('tagIds', filters.tagIds.join(','))
            }

            // Add channel title filter
            if (filters?.channelTitle?.trim()) {
                params.set('channelTitle', filters.channelTitle.trim())
            }

            const response = await fetch(`/api/playlists?${params.toString()}`)
            if (response.ok) {
                const data = await response.json()
                setPlaylists(data.playlists || [])
            } else {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to fetch playlists')
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to fetch playlists',
            )
            console.error('Failed to fetch playlists:', err)
        } finally {
            setLoading(false)
        }
    }, [filters])

    // Sync playlist from YouTube
    const sync = useCallback(async (id: number) => {
        try {
            const response = await fetch(`/api/playlists/${id}/sync`, {
                method: 'POST',
            })

            if (response.ok) {
                const data = await response.json()
                // Update the playlist in the list
                setPlaylists((prev) =>
                    prev.map((p) => (p.id === id ? data.playlist : p)),
                )
                toast.success(
                    `Synced: ${data.added} added, ${data.removed} removed`,
                )
            } else {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to sync playlist')
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to sync playlist',
            )
            console.error('Failed to sync playlist:', err)
            toast.error('Failed to sync playlist')
        }
    }, [])

    // Delete playlist
    const deletePlaylist = useCallback(
        async (id: number) => {
            try {
                const response = await fetch(`/api/playlists/${id}`, {
                    method: 'DELETE',
                })

                if (response.ok) {
                    // Remove from list
                    setPlaylists((prev) => prev.filter((p) => p.id !== id))
                    toast.success('Playlist deleted')
                } else {
                    const errorData = await response.json()
                    throw new Error(
                        errorData.error || 'Failed to delete playlist',
                    )
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to delete playlist',
                )
                console.error('Failed to delete playlist:', err)
                await fetchPlaylists()
            }
        },
        [fetchPlaylists],
    )

    // Mark playlist as completed (all videos watched)
    const markCompleted = useCallback(
        async (id: number) => {
            try {
                const response = await fetch(
                    `/api/playlists/${id}/mark-completed`,
                    {
                        method: 'POST',
                    },
                )

                if (response.ok) {
                    // Update the playlist in the list
                    setPlaylists((prev) =>
                        prev.map((p) =>
                            p.id === id
                                ? {
                                      ...p,
                                      watchedCount: p.itemCount,
                                      unwatchedCount: 0,
                                  }
                                : p,
                        ),
                    )
                    toast.success('Playlist marked as completed')
                } else {
                    const errorData = await response.json()
                    throw new Error(
                        errorData.error ||
                            'Failed to mark playlist as completed',
                    )
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to mark playlist as completed',
                )
                console.error('Failed to mark playlist as completed:', err)
                await fetchPlaylists()
            }
        },
        [fetchPlaylists],
    )

    // Unmark playlist as completed (reset to unwatched)
    const unmarkCompleted = useCallback(
        async (id: number) => {
            try {
                const response = await fetch(
                    `/api/playlists/${id}/unmark-completed`,
                    {
                        method: 'POST',
                    },
                )

                if (response.ok) {
                    // Update the playlist in the list
                    setPlaylists((prev) =>
                        prev.map((p) =>
                            p.id === id
                                ? {
                                      ...p,
                                      watchedCount: 0,
                                      unwatchedCount: p.itemCount,
                                  }
                                : p,
                        ),
                    )
                    toast.success('Playlist marked as active')
                } else {
                    const errorData = await response.json()
                    throw new Error(
                        errorData.error || 'Failed to unmark playlist',
                    )
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to unmark playlist',
                )
                console.error('Failed to unmark playlist:', err)
                await fetchPlaylists()
            }
        },
        [fetchPlaylists],
    )

    useEffect(() => {
        if (autoFetch) {
            fetchPlaylists()
        }
    }, [autoFetch, fetchPlaylists])

    return {
        playlists,
        loading,
        error,
        refetch: fetchPlaylists,
        sync,
        deletePlaylist,
        markCompleted,
        unmarkCompleted,
    }
}
