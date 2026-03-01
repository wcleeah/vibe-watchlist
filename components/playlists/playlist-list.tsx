'use client'

import { ListMusic } from 'lucide-react'

import { MediaList, SortableMediaList } from '@/components/shared'

import type { PlaylistSummary } from '@/types/playlist'

import { PlaylistCard } from './playlist-card'

interface PlaylistListProps {
    playlists: PlaylistSummary[]
    loading?: boolean
    onViewItems: (playlist: PlaylistSummary) => void
    onEdit?: (playlist: PlaylistSummary) => void
    onSync?: (playlistId: number) => Promise<void>
    onDelete?: (playlistId: number) => Promise<void>
    onRefreshMetadata?: (playlist: PlaylistSummary) => void
    onReorder?: (orderedIds: number[]) => Promise<void>
    emptyState?: {
        title: string
        description: string
    }
}

export function PlaylistList({
    playlists,
    loading = false,
    onViewItems,
    onEdit,
    onSync,
    onDelete,
    onRefreshMetadata,
    onReorder,
    emptyState,
}: PlaylistListProps) {
    const renderCard = (playlist: PlaylistSummary) => (
        <PlaylistCard
            playlist={playlist}
            onViewItems={onViewItems}
            onEdit={onEdit}
            onSync={onSync}
            onDelete={onDelete}
            onRefreshMetadata={onRefreshMetadata}
        />
    )

    const emptyStateConfig = {
        title: emptyState?.title || 'No playlists found',
        description:
            emptyState?.description ||
            'Import a YouTube playlist from the home page to get started',
        icon: (
            <ListMusic className='w-16 h-16 text-gray-300 dark:text-gray-700 mb-4' />
        ),
    }

    // If onReorder is provided, use SortableMediaList for drag-and-drop
    if (onReorder) {
        return (
            <SortableMediaList
                items={playlists}
                renderCard={renderCard}
                keyExtractor={(playlist) => playlist.id}
                onReorder={onReorder}
                loading={loading}
                emptyState={emptyStateConfig}
            />
        )
    }

    // Otherwise use regular MediaList (read-only mode)
    return (
        <MediaList
            items={playlists}
            renderCard={renderCard}
            keyExtractor={(playlist) => playlist.id}
            loading={loading}
            emptyState={emptyStateConfig}
        />
    )
}
