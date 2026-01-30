'use client'

import { ListMusic } from 'lucide-react'

import { MediaList } from '@/components/shared'

import type { PlaylistSummary } from '@/types/playlist'

import { PlaylistCard } from './playlist-card'

interface PlaylistListProps {
    playlists: PlaylistSummary[]
    loading?: boolean
    onViewItems: (playlist: PlaylistSummary) => void
    onSync?: (playlistId: number) => Promise<void>
    onDelete?: (playlistId: number) => Promise<void>
    emptyState?: {
        title: string
        description: string
    }
}

export function PlaylistList({
    playlists,
    loading = false,
    onViewItems,
    onSync,
    onDelete,
    emptyState,
}: PlaylistListProps) {
    const renderCard = (playlist: PlaylistSummary) => (
        <PlaylistCard
            playlist={playlist}
            onViewItems={onViewItems}
            onSync={onSync}
            onDelete={onDelete}
        />
    )

    return (
        <MediaList
            items={playlists}
            renderCard={renderCard}
            loading={loading}
            emptyState={{
                title: emptyState?.title || 'No playlists found',
                description:
                    emptyState?.description ||
                    'Import a YouTube playlist from the home page to get started',
                icon: (
                    <ListMusic className='w-16 h-16 text-gray-300 dark:text-gray-700 mb-4' />
                ),
            }}
        />
    )
}
