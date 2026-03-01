'use client'

import { Globe, Pencil } from 'lucide-react'
import { useState } from 'react'

import { type ActionConfig, ErrorDisplay, MediaCard } from '@/components/shared'
import { cn } from '@/lib/utils'

import type { PreviewCardProps } from './types'
import { VideoCardEditable } from './video-card-editable'

/**
 * VideoCard component - displays a video with actions
 * Uses shared MediaCard for consistent styling across the app
 */
export function VideoCard({
    video,
    showActions = false,
    onMarkWatched,
    onDelete,
    onEdit,
    onRefreshMetadata,
    onThumbnailUrlChange,
    onTitleChange,
    onToggleManual: onToggleManualProp,
    className,
    showBackground = true,
    editable = false,
}: PreviewCardProps) {
    const [loadingMarkWatched, setLoadingMarkWatched] = useState(false)
    const [loadingDelete, setLoadingDelete] = useState(false)
    const [manualMode, setManualMode] = useState(false)

    const toggleManual = () => {
        // If externally controlled via editable prop, just call the callback
        if (onToggleManualProp) {
            onToggleManualProp()
        } else {
            // Otherwise, toggle local state
            setManualMode(!manualMode)
        }
    }

    // Error state
    if (video.error) {
        return (
            <div
                className={cn(
                    'bg-white dark:bg-black rounded-lg border border-black dark:border-white p-6 min-h-[300px]',
                    className,
                )}
            >
                <ErrorDisplay
                    error={video.error}
                    onToggleManual={toggleManual}
                    variant='centered'
                />
            </div>
        )
    }

    // Editable/Manual mode - used for add video form
    if (manualMode || editable) {
        return (
            <VideoCardEditable
                video={video}
                onTitleChange={onTitleChange}
                onThumbnailUrlChange={onThumbnailUrlChange}
                onToggleManual={toggleManual}
                className={className}
                showBackground={showBackground}
            />
        )
    }

    // Preview mode without actions
    if (!showActions) {
        return (
            <MediaCard
                item={video}
                title={video.title || 'Untitled Video'}
                thumbnailUrl={video.thumbnailUrl || null}
                url={video.url}
                tags={video.tags}
                metadata={[
                    ...(video.id
                        ? [
                              {
                                  key: 'ID',
                                  value: video.id,
                                  color: 'cyan' as const,
                              },
                          ]
                        : []),
                    {
                        key: 'PLATFORM',
                        value: video.platform,
                        color: 'green' as const,
                    },
                ]}
                primaryActions={[]}
                className={cn(!showBackground && 'border-0', className)}
            />
        )
    }

    // Build action configurations
    const primaryActions: ActionConfig[] = [
        {
            id: 'watch',
            label: 'watch()',
            href: video.url,
            variant: 'primary',
        },
    ]

    if (onMarkWatched) {
        primaryActions.push({
            id: 'mark-watched',
            label: video.isWatched ? 'unWatch()' : 'markWatched()',
            onClick: async () => {
                if (!video.id) return
                setLoadingMarkWatched(true)
                try {
                    await onMarkWatched(video.id)
                } finally {
                    setLoadingMarkWatched(false)
                }
            },
            variant: 'secondary',
            loading: loadingMarkWatched,
        })
    }

    const secondaryActions: ActionConfig[] = []

    if (onEdit) {
        secondaryActions.push({
            id: 'edit',
            label: 'edit()',
            onClick: () => onEdit(video),
            variant: 'ghost',
            icon: <Pencil className='w-3 h-3' />,
        })
    }

    if (onRefreshMetadata) {
        secondaryActions.push({
            id: 'refresh-metadata',
            label: 'refreshMetadata()',
            onClick: () => onRefreshMetadata(video),
            variant: 'ghost',
            icon: <Globe className='w-3 h-3' />,
        })
    }

    // Delete action - always visible
    const deleteAction: ActionConfig | undefined = onDelete
        ? {
              id: 'delete',
              label: 'delete()',
              onClick: async () => {
                  if (!video.id) return
                  setLoadingDelete(true)
                  try {
                      await onDelete(video.id)
                  } finally {
                      setLoadingDelete(false)
                  }
              },
              variant: 'danger',
              loading: loadingDelete,
          }
        : undefined

    return (
        <MediaCard
            item={video}
            title={video.title || 'Untitled Video'}
            thumbnailUrl={video.thumbnailUrl || null}
            url={video.url}
            tags={video.tags}
            metadata={[
                ...(video.id
                    ? [{ key: 'ID', value: video.id, color: 'cyan' as const }]
                    : []),
                {
                    key: 'PLATFORM',
                    value: video.platform,
                    color: 'green' as const,
                },
            ]}
            primaryActions={primaryActions}
            secondaryActions={secondaryActions}
            deleteAction={deleteAction}
            className={className}
        />
    )
}

// Re-export ThumbnailDisplay for backwards compatibility
export { ThumbnailDisplay } from '@/components/shared'
