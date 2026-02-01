'use client'

import { ExternalLink, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'

import {
    type ActionConfig,
    MediaCard,
    type MediaMetadataItem,
} from '@/components/shared'

import type { PlaylistSummary } from '@/types/playlist'

interface PlaylistCardProps {
    playlist: PlaylistSummary
    onViewItems: (playlist: PlaylistSummary) => void
    onEdit?: (playlist: PlaylistSummary) => void
    onSync?: (playlistId: number) => Promise<void>
    onDelete?: (playlistId: number) => Promise<void>
}

export function PlaylistCard({
    playlist,
    onViewItems,
    onEdit,
    onSync,
    onDelete,
}: PlaylistCardProps) {
    const [isSyncing, setIsSyncing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleSync = async () => {
        if (!onSync) return
        setIsSyncing(true)
        try {
            await onSync(playlist.id)
        } finally {
            setIsSyncing(false)
        }
    }

    const handleDelete = async () => {
        if (!onDelete) return
        setIsDeleting(true)
        try {
            await onDelete(playlist.id)
        } finally {
            setIsDeleting(false)
        }
    }

    // Build metadata
    const metadata: MediaMetadataItem[] = [
        { key: 'ID', value: playlist.id, color: 'cyan' },
        { key: 'ITEMS', value: playlist.itemCount, color: 'green' },
        { key: 'WATCHED', value: playlist.watchedCount, color: 'green' },
    ]

    if (playlist.channelTitle) {
        metadata.push({
            key: 'CHANNEL',
            value: playlist.channelTitle,
            color: 'yellow',
        })
    }

    // Build primary actions
    const primaryActions: ActionConfig[] = [
        {
            id: 'view-items',
            label: 'viewItems()',
            onClick: () => onViewItems(playlist),
            variant: 'primary',
        },
        {
            id: 'open-youtube',
            label: 'openYouTube()',
            href: `https://www.youtube.com/playlist?list=${playlist.youtubePlaylistId}`,
            icon: <ExternalLink className='w-3 h-3' />,
            variant: 'secondary',
        },
        {
            id: 'sync',
            label: 'sync()',
            onClick: handleSync,
            icon: <RefreshCw className='w-3 h-3' />,
            variant: 'info',
            condition: !!onSync,
            loading: isSyncing,
        },
    ]

    // Build secondary actions (shown under more() button)
    const secondaryActions: ActionConfig[] = []

    if (onEdit) {
        secondaryActions.push({
            id: 'edit',
            label: 'edit()',
            onClick: () => onEdit(playlist),
            variant: 'ghost',
            icon: <Pencil className='w-3 h-3' />,
        })
    }

    // Delete action - always visible
    const deleteAction: ActionConfig | undefined = onDelete
        ? {
              id: 'delete',
              label: 'delete()',
              onClick: handleDelete,
              icon: <Trash2 className='w-3 h-3' />,
              variant: 'danger',
              loading: isDeleting,
          }
        : undefined

    return (
        <MediaCard
            item={playlist}
            title={playlist.title || 'Untitled Playlist'}
            thumbnailUrl={playlist.thumbnailUrl}
            url={`https://www.youtube.com/playlist?list=${playlist.youtubePlaylistId}`}
            tags={playlist.tags}
            metadata={metadata}
            primaryActions={primaryActions}
            secondaryActions={secondaryActions}
            deleteAction={deleteAction}
            showProgress={true}
            progressCurrent={playlist.watchedCount}
            progressTotal={playlist.itemCount}
            progressLabel={`${playlist.watchedCount} / ${playlist.itemCount} videos watched`}
        />
    )
}
