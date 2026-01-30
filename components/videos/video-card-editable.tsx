'use client'

import { FileText } from 'lucide-react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

import type { VideoData } from './types'

interface VideoCardEditableProps {
    video: VideoData
    onTitleChange?: (title: string) => void
    onThumbnailUrlChange?: (url: string) => void
    onToggleManual?: () => void
    className?: string
    showBackground?: boolean
}

/**
 * Editable version of VideoCard - used for manual entry in add video form
 */
export function VideoCardEditable({
    video,
    onTitleChange,
    onThumbnailUrlChange,
    onToggleManual,
    className,
    showBackground = true,
}: VideoCardEditableProps) {
    return (
        <div
            className={cn(
                showBackground && 'bg-white dark:bg-black',
                'rounded-lg min-h-[240px]',
                className,
            )}
        >
            <div className='px-4 pt-4 pb-4 space-y-1 max-w-full overflow-hidden'>
                {/* Title Section - Editable */}
                <div className='pb-2 border-b border-black dark:border-white'>
                    <div className='space-y-2'>
                        <label
                            htmlFor='title'
                            className='text-sm font-medium text-gray-700 dark:text-gray-300'
                        >
                            Title
                        </label>
                        <input
                            id='title'
                            value={video.title ?? ''}
                            type='text'
                            placeholder='Enter video title'
                            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white font-mono'
                            onChange={(e) => {
                                if (onTitleChange) {
                                    onTitleChange(e.target.value)
                                }
                            }}
                        />
                        {onToggleManual && (
                            <button
                                type='button'
                                onClick={onToggleManual}
                                className='text-sm text-blue-600 dark:text-blue-400 hover:underline'
                            >
                                Cancel manual entry
                            </button>
                        )}
                    </div>
                </div>

                {/* Thumbnail + Content Row */}
                <div className='flex flex-col sm:flex-row gap-4'>
                    {/* Thumbnail - Editable */}
                    <div className='w-full sm:w-[304px] aspect-video sm:aspect-auto sm:flex-shrink-0 sm:h-[171px] pt-4'>
                        <div className='space-y-2'>
                            <label
                                htmlFor='thumbnailUrl'
                                className='text-sm font-medium text-gray-700 dark:text-gray-300'
                            >
                                Thumbnail URL
                            </label>
                            <input
                                value={video.thumbnailUrl ?? ''}
                                id='thumbnailUrl'
                                type='url'
                                placeholder='https://example.com/thumbnail.jpg'
                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white font-mono text-sm'
                                onChange={(e) => {
                                    if (onThumbnailUrlChange) {
                                        onThumbnailUrlChange(e.target.value)
                                    }
                                }}
                            />
                            {video.thumbnailUrl && (
                                <div className='relative w-full h-32'>
                                    <Image
                                        src={video.thumbnailUrl}
                                        alt={video.title || 'Video thumbnail'}
                                        fill
                                        loading='lazy'
                                        className='object-contain rounded'
                                    />
                                </div>
                            )}
                        </div>
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
                                            &quot;{video.platform}&quot;
                                        </span>
                                        ,
                                    </div>
                                    {video.tags && video.tags.length > 0 && (
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
