'use client'

import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { PlaylistSummary } from '@/types/playlist'
import { PlaylistCard } from './playlist-card'
import { PlaylistItemsModal } from './playlist-items-modal'

export function PlaylistList() {
    const [playlists, setPlaylists] = useState<PlaylistSummary[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedPlaylist, setSelectedPlaylist] =
        useState<PlaylistSummary | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const fetchPlaylists = useCallback(async () => {
        try {
            const response = await fetch('/api/playlists')
            if (!response.ok) {
                throw new Error('Failed to fetch playlists')
            }
            const data = await response.json()
            setPlaylists(data.playlists || [])
        } catch (error) {
            console.error('Error fetching playlists:', error)
            toast.error('Failed to load playlists')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPlaylists()
    }, [fetchPlaylists])

    const handleViewItems = (playlist: PlaylistSummary) => {
        setSelectedPlaylist(playlist)
        setIsModalOpen(true)
    }

    const handleSync = async (playlistId: number) => {
        try {
            const response = await fetch(`/api/playlists/${playlistId}/sync`, {
                method: 'POST',
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to sync playlist')
            }

            const data = await response.json()
            toast.success(
                `Synced: ${data.added} added, ${data.removed} removed`,
            )
            await fetchPlaylists()
        } catch (error) {
            console.error('Error syncing playlist:', error)
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to sync playlist',
            )
        }
    }

    const handleDelete = async (playlistId: number) => {
        if (
            !confirm(
                'Are you sure you want to delete this playlist? All associated videos will also be deleted.',
            )
        ) {
            return
        }

        try {
            const response = await fetch(`/api/playlists/${playlistId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to delete playlist')
            }

            toast.success('Playlist deleted')
            await fetchPlaylists()
        } catch (error) {
            console.error('Error deleting playlist:', error)
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to delete playlist',
            )
        }
    }

    if (isLoading) {
        return (
            <div className='flex items-center justify-center py-12'>
                <Loader2 className='w-8 h-8 animate-spin text-gray-500' />
            </div>
        )
    }

    if (playlists.length === 0) {
        return (
            <div className='text-center py-12'>
                <p className='text-gray-500 dark:text-gray-400 mb-2'>
                    No playlists yet
                </p>
                <p className='text-sm text-gray-400 dark:text-gray-500'>
                    Import a YouTube playlist from the home page to get started
                </p>
            </div>
        )
    }

    return (
        <>
            <div className='space-y-4'>
                {playlists.map((playlist) => (
                    <PlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        onViewItems={handleViewItems}
                        onSync={handleSync}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            <PlaylistItemsModal
                playlist={selectedPlaylist}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onRefresh={fetchPlaylists}
            />
        </>
    )
}
