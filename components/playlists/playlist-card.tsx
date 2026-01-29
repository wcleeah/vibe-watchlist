'use client'

import { ExternalLink, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import type { PlaylistSummary } from '@/types/playlist'

interface PlaylistCardProps {
    playlist: PlaylistSummary
    onViewItems: (playlist: PlaylistSummary) => void
    onSync?: (playlistId: number) => Promise<void>
    onDelete?: (playlistId: number) => Promise<void>
}

export function PlaylistCard({
    playlist,
    onViewItems,
    onSync,
    onDelete,
}: PlaylistCardProps) {
    const [isSyncing, setIsSyncing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const progress =
        playlist.itemCount > 0
            ? Math.round((playlist.watchedCount / playlist.itemCount) * 100)
            : 0

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

    return (
        <div className='bg-white dark:bg-black rounded-lg border border-black dark:border-white min-h-[240px]'>
            <div className='min-h-[240px] grid grid-cols-1 md:grid-cols-[8fr_2fr]'>
                {/* Content Column */}
                <div className='px-4 pt-4 pb-4 space-y-1 max-w-full overflow-hidden'>
                    {/* Title Section */}
                    <div className='pb-2 border-b border-black dark:border-white'>
                        <div className='flex items-center justify-between'>
                            <h3
                                className='text-lg font-bold text-black dark:text-white font-mono truncate text-center sm:text-left flex-1 min-w-0'
                                title={playlist.title || 'Untitled Playlist'}
                            >
                                {playlist.title || 'Untitled Playlist'}
                            </h3>
                            {playlist.channelTitle && (
                                <span className='text-sm text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0'>
                                    by {playlist.channelTitle}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Thumbnail + Content Row */}
                    <div className='flex flex-col sm:flex-row gap-4'>
                        {/* Thumbnail */}
                        <div className='w-full sm:w-[304px] aspect-video sm:aspect-auto sm:flex-shrink-0 sm:h-[171px] pt-4'>
                            {playlist.thumbnailUrl ? (
                                <div className='relative w-full h-full'>
                                    <Image
                                        src={playlist.thumbnailUrl}
                                        alt={
                                            playlist.title ||
                                            'Playlist thumbnail'
                                        }
                                        fill
                                        loading='lazy'
                                        className='object-contain rounded'
                                    />
                                </div>
                            ) : (
                                <div className='w-full h-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center'>
                                    <span className='text-gray-500 dark:text-gray-400 text-sm'>
                                        No thumbnail
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className='flex-1 min-w-0 w-full sm:w-auto sm:flex sm:items-center'>
                            <div className='rounded-lg p-4 font-mono w-full'>
                                <div className='text-sm'>
                                    {'{'}
                                    <div className='ml-4 space-y-1'>
                                        <div>
                                            <span className='text-cyan-600 dark:text-cyan-400'>
                                                &quot;ID&quot;
                                            </span>
                                            :{' '}
                                            <span className='text-cyan-600 dark:text-cyan-400'>
                                                {playlist.id}
                                            </span>
                                            ,
                                        </div>
                                        <div>
                                            <span className='text-purple-600 dark:text-purple-400'>
                                                &quot;ITEMS&quot;
                                            </span>
                                            :{' '}
                                            <span className='text-green-600 dark:text-green-400'>
                                                {playlist.itemCount}
                                            </span>
                                            ,
                                        </div>
                                        <div>
                                            <span className='text-purple-600 dark:text-purple-400'>
                                                &quot;WATCHED&quot;
                                            </span>
                                            :{' '}
                                            <span className='text-green-600 dark:text-green-400'>
                                                {playlist.watchedCount}
                                            </span>
                                            ,
                                        </div>
                                        <div>
                                            <span className='text-purple-600 dark:text-purple-400'>
                                                &quot;PROGRESS&quot;
                                            </span>
                                            :{' '}
                                            <span className='text-yellow-600 dark:text-yellow-400'>
                                                &quot;{progress}%&quot;
                                            </span>
                                        </div>
                                    </div>
                                    {'}'}
                                </div>

                                {/* Progress bar */}
                                <div className='mt-4'>
                                    <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                                        <div
                                            className='bg-green-500 h-2 rounded-full transition-all duration-300'
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                        {playlist.watchedCount} /{' '}
                                        {playlist.itemCount} videos watched
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Column */}
                <div className='px-4 pt-4 pb-4 flex flex-col md:border-l border-black dark:border-white justify-center'>
                    <div className='flex flex-col gap-2 justify-center mb-8'>
                        <button
                            type='button'
                            onClick={() => onViewItems(playlist)}
                            className='w-full h-8 min-h-[44px] text-xs px-2 bg-primary text-primary-foreground dark:bg-white dark:text-black hover:bg-primary/90 dark:hover:bg-gray-100 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center font-bold'
                            title='viewItems()'
                            aria-label='View playlist items'
                        >
                            viewItems()
                        </button>
                        <a
                            href={`https://www.youtube.com/playlist?list=${playlist.youtubePlaylistId}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='w-full h-8 min-h-[44px] text-xs px-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center'
                            title='openYouTube()'
                            aria-label='Open playlist on YouTube'
                        >
                            <ExternalLink className='w-3 h-3 mr-1' />
                            openYouTube()
                        </a>
                        {onSync && (
                            <button
                                type='button'
                                onClick={handleSync}
                                disabled={isSyncing}
                                className='w-full h-8 min-h-[44px] text-xs px-2 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center'
                                title='sync()'
                                aria-label='Sync playlist from YouTube'
                            >
                                {isSyncing ? (
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                    <>
                                        <RefreshCw className='w-3 h-3 mr-1' />
                                        sync()
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {onDelete && (
                        <div className='flex justify-center'>
                            <button
                                type='button'
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className='w-full h-8 min-h-[44px] text-xs px-2 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center'
                                title='delete()'
                                aria-label='Delete playlist'
                            >
                                {isDeleting ? (
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                    <>
                                        <Trash2 className='w-3 h-3 mr-1' />
                                        delete()
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
