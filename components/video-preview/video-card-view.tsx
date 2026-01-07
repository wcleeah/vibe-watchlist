'use client'

import { FileText } from 'lucide-react'
import { PLATFORM_NAMES } from '@/lib/utils/platform-utils'
import { ErrorDisplay } from './error-display'
import { ThumbnailDisplay } from './metadata-components'
import type { VideoData } from './types'
import type { Tag } from '@/types/tag'

interface VideoCardViewProps {
    video: VideoData
    showActions?: boolean
    onMarkWatched?: (id: number) => void
    onDelete?: (id: number) => void
    className?: string
    showBackground?: boolean
}

export function VideoCardView({
    video,
    showActions = false,
    onMarkWatched,
    onDelete,
    className,
    showBackground = true,
}: VideoCardViewProps) {
    if (video.error) {
        return (
            <div
                className={`bg-white dark:bg-black rounded-lg border border-black dark:border-white p-6 min-h-[300px] ${className}`}
            >
                <ErrorDisplay error={video.error} />
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
                <div className='px-4 pt-4 pb-4 space-y-1'>
                    {/* Title Section */}
                    <div className='pb-2 border-b border-black dark:border-white'>
                        <h3
                            className='text-lg font-bold text-black dark:text-white font-mono truncate text-center sm:text-left flex-1'
                            title={video.title || 'Untitled Video'}
                        >
                            {video.title || 'Untitled Video'}
                        </h3>
                    </div>

                    {/* Thumbnail + Content Row */}
                    <div className='flex flex-col sm:flex-row gap-4'>
                        {/* Thumbnail */}
                        <div className='w-full sm:w-[304px] aspect-video sm:aspect-auto sm:flex-shrink-0 sm:h-[171px] pt-4'>
                            {video.thumbnailUrl ? (
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
                                        {video.id != null &&
                                            video.id !== undefined && (
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
                                                {PLATFORM_NAMES[
                                                    video.platform as keyof typeof PLATFORM_NAMES
                                                ] || video.platform}
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
                                                                (tag: Tag) =>
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

                {/* Action Column (20%) - Full height on desktop, horizontal at bottom on mobile */}
                {showActions && (
                    <div className='px-4 pt-4 pb-4 flex flex-col md:border-l border-black dark:border-white justify-center'>
                        {/* Main action buttons */}
                        <div className='flex flex-col gap-2 justify-center mb-8'>
                            <a
                                href={video.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='w-full h-8 min-h-[44px] text-xs px-2 bg-primary text-primary-foreground dark:bg-white dark:text-black hover:bg-primary/90 dark:hover:bg-gray-100 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center font-bold'
                                title='watch()'
                                aria-label='Watch video'
                            >
                                watch()
                            </a>
                            <button
                                type='button'
                                onClick={() =>
                                    navigator.clipboard.writeText(video.url)
                                }
                                className='w-full h-8 min-h-[44px] text-xs px-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center'
                                title='copyUrl()'
                                aria-label='Copy video URL'
                            >
                                copyUrl()
                            </button>
                            {onMarkWatched && (
                                <button
                                    type='button'
                                    onClick={async () => {
                                        // onMarkWatched(video.id)
                                    }}
                                    className='w-full h-8 min-h-[44px] text-xs px-2 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center'
                                    title={
                                        video.isWatched
                                            ? 'un-watch()'
                                            : 'markWatched()'
                                    }
                                    aria-label={
                                        video.isWatched
                                            ? 'Mark as unwatched'
                                            : 'Mark as watched'
                                    }
                                >
                                    {video.isWatched
                                        ? 'unWatch()'
                                        : 'markWatched()'}
                                </button>
                            )}
                        </div>

                        {/* Delete button separated at bottom */}
                        {onDelete && (
                            <div className='flex justify-center'>
                                <button
                                    type='button'
                                    onClick={async () => {
                                        // onDelete(video.id)
                                    }}
                                    className='w-full h-8 min-h-[44px] text-xs px-2 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center'
                                    title='delete()'
                                    aria-label='Delete video'
                                >
                                    delete()
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
