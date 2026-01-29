'use client'

import {
    ChevronDown,
    Copy,
    FileText,
    ListMusic,
    Loader2,
    Pencil,
    RefreshCw,
} from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { ErrorDisplay } from './error-display'
import type { PreviewCardProps, VideoData } from './types'

interface ThumbnailDisplayProps {
    video: VideoData
    className?: string
}

export function ThumbnailDisplay({ video, className }: ThumbnailDisplayProps) {
    if (!video.thumbnailUrl) {
        return (
            <div
                className={`w-full max-w-xs mx-auto h-32 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center ${className}`}
            >
                <span className='text-gray-500 dark:text-gray-400 text-sm'>
                    No thumbnail
                </span>
            </div>
        )
    }

    return (
        <div className={`relative w-full h-full ${className}`}>
            <Image
                src={video.thumbnailUrl}
                alt={video.title || 'Video thumbnail'}
                fill
                loading='lazy'
                className='object-contain rounded'
            />
        </div>
    )
}

export function VideoCard({
    video,
    showActions = false,
    onMarkWatched,
    onDelete,
    onEdit,
    onConvertToSeries,
    onConvertToPlaylist,
    isPlaylistUrl = false,
    onThumbnailUrlChange,
    onTitleChange,
    className,
    showBackground = true,
    editable = false,
}: PreviewCardProps) {
    const [loadingMarkWatched, setLoadingMarkWatched] = useState(false)
    const [loadingDelete, setLoadingDelete] = useState(false)
    const [actionsExpanded, setActionsExpanded] = useState(false)

    // Internal manual mode state - overrides external if provided
    const [manualMode, setManualMode] = useState(false)

    // Determine if there are secondary actions to show
    const hasSecondaryActions =
        onEdit || onConvertToSeries || (onConvertToPlaylist && isPlaylistUrl)

    const toggleManual = () => {
        setManualMode(!manualMode)
    }

    if (video.error) {
        return (
            <div
                className={`bg-white dark:bg-black rounded-lg border border-black dark:border-white p-6 min-h-[300px] ${className}`}
            >
                <ErrorDisplay
                    error={video.error}
                    onToggleManual={toggleManual}
                />
            </div>
        )
    }

    const borderClass = showActions
        ? 'border border-black dark:border-white'
        : ''

    return (
        <div
            className={`${showBackground ? 'bg-white dark:bg-black' : ''} rounded-lg ${borderClass} min-h-[240px] ${className}`}
        >
            {/* Responsive layout: 2-column on desktop, stacked on mobile */}
            <div
                className={`min-h-[240px] ${showActions ? 'grid grid-cols-1 md:grid-cols-[8fr_2fr]' : ''}`}
            >
                {/* Content Column (full width when no actions, 80% when actions shown) */}
                <div className='px-4 pt-4 pb-4 space-y-1 max-w-full overflow-hidden'>
                    {/* Title Section */}
                    <div className='pb-2 border-b border-black dark:border-white'>
                        {manualMode ? (
                            <div className='space-y-2'>
                                <label
                                    htmlFor='title'
                                    className='text-sm font-medium text-gray-700 dark:text-gray-300'
                                >
                                    Title
                                </label>
                                <input
                                    id='title'
                                    value={video.title ?? undefined}
                                    type='text'
                                    placeholder='Enter video title'
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white font-mono'
                                    onChange={(e) => {
                                        if (onTitleChange) {
                                            onTitleChange(e.target.value)
                                        }
                                    }}
                                />
                                <button
                                    type='button'
                                    onClick={toggleManual}
                                    className='text-sm text-blue-600 dark:text-blue-400 hover:underline'
                                >
                                    Cancel manual entry
                                </button>
                            </div>
                        ) : (
                            <div className='flex items-center justify-between'>
                                <h3
                                    className='text-lg font-bold text-black dark:text-white font-mono truncate text-center sm:text-left flex-1 min-w-0'
                                    title={video.title || 'Untitled Video'}
                                >
                                    {video.title || 'Untitled Video'}
                                </h3>
                                {editable && (
                                    <button
                                        type='button'
                                        onClick={toggleManual}
                                        className='text-sm text-blue-600 dark:text-blue-400 hover:underline ml-2 flex-shrink-0'
                                        title='Switch to manual entry mode'
                                    >
                                        Edit manually
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Thumbnail + Content Row */}
                    <div className='flex flex-col sm:flex-row gap-4'>
                        {/* Thumbnail */}
                        <div className='w-full sm:w-[304px] aspect-video sm:aspect-auto sm:flex-shrink-0 sm:h-[171px] pt-4'>
                            {manualMode ? (
                                <div className='space-y-2'>
                                    <label
                                        htmlFor='thumbnailUrl'
                                        className='text-sm font-medium text-gray-700 dark:text-gray-300'
                                    >
                                        Thumbnail URL
                                    </label>
                                    <input
                                        value={video.thumbnailUrl ?? undefined}
                                        id='thumbnailUrl'
                                        type='url'
                                        placeholder='https://example.com/thumbnail.jpg'
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white font-mono text-sm'
                                        onChange={(e) => {
                                            if (onThumbnailUrlChange) {
                                                onThumbnailUrlChange(
                                                    e.target.value,
                                                )
                                            }
                                        }}
                                    />
                                    {video.thumbnailUrl && (
                                        <ThumbnailDisplay video={video} />
                                    )}
                                </div>
                            ) : video.thumbnailUrl ? (
                                <ThumbnailDisplay video={video} />
                            ) : (
                                <div className='w-full h-full bg-gray-200 rounded flex items-center justify-center'>
                                    <FileText className='w-6 h-6 text-gray-400' />
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className='flex-1 min-w-0 w-full sm:w-auto sm:flex sm:items-center'>
                            <div className='rounded-lg p-4 font-mono w-full'>
                                <div className='text-sm'>
                                    {'{'}
                                    <div className='ml-4 space-y-1'>
                                        {video.id && (
                                            <div>
                                                <span className='text-cyan-600 dark:text-cyan-400'>
                                                    &quot;ID&quot;
                                                </span>
                                                :{' '}
                                                <span className='text-cyan-600 dark:text-cyan-400'>
                                                    {video.id}
                                                </span>
                                                ,
                                            </div>
                                        )}
                                        <div>
                                            <span className='text-purple-600 dark:text-purple-400'>
                                                &quot;PLATFORM&quot;
                                            </span>
                                            :{' '}
                                            <span className='text-green-600 dark:text-green-400'>
                                                &quot;
                                                {video.platform}
                                                &quot;
                                            </span>
                                            ,
                                        </div>
                                        {video.tags &&
                                            video.tags.length > 0 && (
                                                <div>
                                                    <span className='text-purple-600 dark:text-purple-400'>
                                                        &quot;TAGS&quot;
                                                    </span>
                                                    :{' '}
                                                    <span className='text-yellow-600 dark:text-yellow-400'>
                                                        [
                                                        {video.tags
                                                            .map(
                                                                (tag) =>
                                                                    `"${tag.name}"`,
                                                            )
                                                            .join(', ')}
                                                        ]
                                                    </span>
                                                </div>
                                            )}
                                    </div>
                                    {'}'}
                                </div>
                                {video.error && (
                                    <div className='mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded'>
                                        <div className='font-mono text-sm text-red-600 dark:text-red-400'>
                                            &quot;ERROR&quot;: &quot;
                                            {video.error}&quot;
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Column - Expandable Panel Design */}
                {showActions && (
                    <div className='px-4 py-4 flex flex-col md:border-l border-border justify-center gap-2'>
                        {/* Primary Actions - Always visible */}
                        <Button
                            variant='default'
                            size='sm'
                            className='w-full text-xs font-bold'
                            asChild
                        >
                            <a
                                href={video.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                title='watch()'
                                aria-label='Watch video'
                            >
                                watch()
                            </a>
                        </Button>

                        {onMarkWatched && (
                            <Button
                                variant='outline'
                                size='sm'
                                className='w-full text-xs'
                                onClick={async () => {
                                    if (!video.id) return
                                    setLoadingMarkWatched(true)
                                    try {
                                        await onMarkWatched(video.id)
                                    } finally {
                                        setLoadingMarkWatched(false)
                                    }
                                }}
                                disabled={loadingMarkWatched}
                                title={
                                    video.isWatched
                                        ? 'unWatch()'
                                        : 'markWatched()'
                                }
                                aria-label={
                                    video.isWatched
                                        ? 'Mark as unwatched'
                                        : 'Mark as watched'
                                }
                            >
                                {loadingMarkWatched ? (
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                ) : video.isWatched ? (
                                    'unWatch()'
                                ) : (
                                    'markWatched()'
                                )}
                            </Button>
                        )}

                        {onDelete && (
                            <Button
                                variant='destructive'
                                size='sm'
                                className='w-full text-xs'
                                onClick={async () => {
                                    if (!video.id) return
                                    setLoadingDelete(true)
                                    try {
                                        await onDelete(video.id)
                                    } finally {
                                        setLoadingDelete(false)
                                    }
                                }}
                                disabled={loadingDelete}
                                title='delete()'
                                aria-label='Delete video'
                            >
                                {loadingDelete ? (
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                    'delete()'
                                )}
                            </Button>
                        )}

                        {/* Expand/Collapse Toggle for Secondary Actions */}
                        {hasSecondaryActions && (
                            <>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    className='w-full text-xs'
                                    onClick={() =>
                                        setActionsExpanded(!actionsExpanded)
                                    }
                                    aria-expanded={actionsExpanded}
                                    aria-label={
                                        actionsExpanded
                                            ? 'Show less actions'
                                            : 'Show more actions'
                                    }
                                >
                                    {actionsExpanded ? 'less()' : 'more()'}
                                    <ChevronDown
                                        className={cn(
                                            'w-4 h-4 transition-transform duration-200',
                                            actionsExpanded && 'rotate-180',
                                        )}
                                    />
                                </Button>

                                {/* Secondary Actions - Expandable */}
                                {actionsExpanded && (
                                    <div className='flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200'>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            className='w-full text-xs'
                                            onClick={() =>
                                                navigator.clipboard.writeText(
                                                    video.url,
                                                )
                                            }
                                            title='copyUrl()'
                                            aria-label='Copy video URL'
                                        >
                                            <Copy className='w-3 h-3' />
                                            copyUrl()
                                        </Button>

                                        {onEdit && (
                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                className='w-full text-xs'
                                                onClick={() => onEdit(video)}
                                                title='edit()'
                                                aria-label='Edit video'
                                            >
                                                <Pencil className='w-3 h-3' />
                                                edit()
                                            </Button>
                                        )}

                                        {onConvertToSeries && (
                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                className='w-full text-xs'
                                                onClick={() =>
                                                    onConvertToSeries(video)
                                                }
                                                title='toSeries()'
                                                aria-label='Convert to series'
                                            >
                                                <RefreshCw className='w-3 h-3' />
                                                toSeries()
                                            </Button>
                                        )}

                                        {onConvertToPlaylist &&
                                            isPlaylistUrl && (
                                                <Button
                                                    variant='ghost'
                                                    size='sm'
                                                    className='w-full text-xs'
                                                    onClick={() =>
                                                        onConvertToPlaylist(
                                                            video,
                                                        )
                                                    }
                                                    title='toPlaylist()'
                                                    aria-label='Convert to playlist'
                                                >
                                                    <ListMusic className='w-3 h-3' />
                                                    toPlaylist()
                                                </Button>
                                            )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
