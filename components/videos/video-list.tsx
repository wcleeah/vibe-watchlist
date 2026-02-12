'use client'

import { Film } from 'lucide-react'

import { MediaList, SortableMediaList } from '@/components/shared'

import type { Video } from '@/lib/db/schema'
import type { Tag } from '@/types/tag'

import { VideoCard } from './video-card'

interface VideoWithTags extends Video {
    tags?: Tag[]
    highlightedTitle?: string
    highlightedTags?: Tag[]
}

interface VideoListProps {
    videos: VideoWithTags[]
    loading?: boolean
    onMarkWatched?: (id: number) => Promise<void>
    onDelete?: (id: number) => Promise<void>
    onEdit?: (video: VideoWithTags) => void
    onRefreshMetadata?: (video: VideoWithTags) => void
    onConvertToSeries?: (video: VideoWithTags) => void
    onConvertToPlaylist?: (video: VideoWithTags) => void
    playlistUrlVideoIds?: Set<number>
    onReorder?: (orderedIds: number[]) => Promise<void>
    emptyState?: {
        title: string
        description: string
    }
}

export function VideoList({
    videos,
    loading = false,
    onMarkWatched,
    onDelete,
    onEdit,
    onRefreshMetadata,
    onConvertToSeries,
    onConvertToPlaylist,
    playlistUrlVideoIds,
    onReorder,
    emptyState,
}: VideoListProps) {
    const renderCard = (video: VideoWithTags) => {
        const isPlaylistUrl = playlistUrlVideoIds?.has(video.id) ?? false
        return (
            <VideoCard
                video={video}
                showActions={true}
                onMarkWatched={onMarkWatched}
                onDelete={onDelete}
                onEdit={onEdit ? () => onEdit(video) : undefined}
                onRefreshMetadata={
                    onRefreshMetadata
                        ? () => onRefreshMetadata(video)
                        : undefined
                }
                onConvertToSeries={
                    onConvertToSeries
                        ? () => onConvertToSeries(video)
                        : undefined
                }
                onConvertToPlaylist={
                    onConvertToPlaylist
                        ? () => onConvertToPlaylist(video)
                        : undefined
                }
                isPlaylistUrl={isPlaylistUrl}
            />
        )
    }

    const emptyStateConfig = {
        title: emptyState?.title || 'No videos found',
        description:
            emptyState?.description ||
            'Add your first video above to get started',
        icon: (
            <Film className='w-16 h-16 text-gray-300 dark:text-gray-700 mb-4' />
        ),
    }

    // If onReorder is provided, use SortableMediaList for drag-and-drop
    if (onReorder) {
        return (
            <SortableMediaList
                items={videos}
                renderCard={renderCard}
                keyExtractor={(video) => video.id}
                onReorder={onReorder}
                loading={loading}
                emptyState={emptyStateConfig}
            />
        )
    }

    // Otherwise use regular MediaList (read-only mode)
    return (
        <MediaList
            items={videos}
            renderCard={renderCard}
            keyExtractor={(video) => video.id}
            loading={loading}
            emptyState={emptyStateConfig}
        />
    )
}
