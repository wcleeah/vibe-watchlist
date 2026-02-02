'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import type { PlaylistImportPreview } from '@/types/playlist'

interface UsePlaylistManagementOptions {
    onSuccess?: () => void
    onReset?: () => void
}

interface UsePlaylistManagementReturn {
    preview: PlaylistImportPreview | null
    loading: boolean
    importing: boolean
    error: string | null
    fetchPreview: (url: string) => Promise<void>
    importPlaylist: (url: string, tagIds: number[]) => Promise<void>
    cancelPreview: () => void
}

/**
 * Hook for managing playlist preview and import operations
 */
export function usePlaylistManagement(
    options: UsePlaylistManagementOptions = {},
): UsePlaylistManagementReturn {
    const { onSuccess, onReset } = options

    const [preview, setPreview] = useState<PlaylistImportPreview | null>(null)
    const [loading, setLoading] = useState(false)
    const [importing, setImporting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchPreview = useCallback(async (url: string) => {
        if (!url) {
            setError('Please enter a playlist URL')
            return
        }

        setError(null)
        setLoading(true)

        try {
            const response = await fetch('/api/playlists/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to fetch playlist info')
            }

            const data = await response.json()
            setPreview(data.preview)
        } catch (err) {
            console.error('Failed to preview playlist:', err)
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to fetch playlist info',
            )
        } finally {
            setLoading(false)
        }
    }, [])

    const importPlaylist = useCallback(
        async (url: string, tagIds: number[]) => {
            if (!url) {
                setError('Please enter a playlist URL')
                return
            }

            setError(null)
            setImporting(true)

            try {
                const response = await fetch('/api/playlists', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, tagIds }),
                })

                if (!response.ok) {
                    const data = await response.json()
                    throw new Error(data.error || 'Failed to import playlist')
                }

                toast.success('Playlist imported successfully!')
                setPreview(null)
                onSuccess?.()
                onReset?.()
            } catch (err) {
                console.error('Failed to import playlist:', err)
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to import playlist',
                )
            } finally {
                setImporting(false)
            }
        },
        [onSuccess, onReset],
    )

    const cancelPreview = useCallback(() => {
        setPreview(null)
        setError(null)
    }, [])

    return {
        preview,
        loading,
        importing,
        error,
        fetchPreview,
        importPlaylist,
        cancelPreview,
    }
}
