'use client'

import { Check, Pencil, X } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EditableMediaCardProps {
    // Display data
    title: string
    thumbnailUrl: string | null
    url: string
    metadata: { key: string; value: string | number; color?: string }[]
    tags?: Array<{ id: number; name: string }>

    // Edit mode control
    isEditing?: boolean
    onTitleChange?: (title: string) => void
    onThumbnailUrlChange?: (url: string) => void
    onEditToggle?: () => void

    // Styling
    className?: string
}

const colorClasses: Record<string, string> = {
    cyan: 'text-cyan-600 dark:text-cyan-400',
    purple: 'text-purple-600 dark:text-purple-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    blue: 'text-blue-600 dark:text-blue-400',
    red: 'text-red-600 dark:text-red-400',
    orange: 'text-orange-600 dark:text-orange-400',
}

export function EditableMediaCard({
    title,
    thumbnailUrl,
    url,
    metadata,
    tags,
    isEditing = false,
    onTitleChange,
    onThumbnailUrlChange,
    onEditToggle,
    className,
}: EditableMediaCardProps) {
    const [localThumbnailUrl, setLocalThumbnailUrl] = useState(
        thumbnailUrl || '',
    )
    const [showThumbnailPreview, setShowThumbnailPreview] = useState(false)

    // Handle thumbnail URL change with local state for preview
    const handleThumbnailChange = (url: string) => {
        setLocalThumbnailUrl(url)
        onThumbnailUrlChange?.(url)
    }

    return (
        <div
            className={cn(
                'bg-white dark:bg-black rounded-lg border border-black dark:border-white min-h-[240px]',
                className,
            )}
        >
            <div className='px-4 pt-4 pb-4 space-y-1 max-w-full overflow-hidden'>
                {/* Title Section - Same position, editable or display */}
                <div className='pb-2 border-b border-black dark:border-white'>
                    <div className='flex items-center justify-between gap-2'>
                        {isEditing ? (
                            <div className='flex items-center gap-2 flex-1'>
                                <input
                                    type='text'
                                    value={title}
                                    onChange={(e) =>
                                        onTitleChange?.(e.target.value)
                                    }
                                    placeholder='Enter video title'
                                    className='flex-1 px-3 py-2 text-lg font-bold font-mono 
                                               bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 
                                               rounded text-black dark:text-white 
                                               focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    // Focus managed by parent
                                />
                            </div>
                        ) : (
                            <h3
                                className='text-lg font-bold text-black dark:text-white font-mono truncate flex-1 min-w-0'
                                title={title || 'Untitled'}
                            >
                                {title || 'Untitled'}
                            </h3>
                        )}

                        {/* Edit toggle button */}
                        {onEditToggle && (
                            <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={onEditToggle}
                                className='flex-shrink-0 h-8'
                            >
                                {isEditing ? (
                                    <>
                                        <Check className='w-3 h-3 mr-1' />
                                        Done
                                    </>
                                ) : (
                                    <>
                                        <Pencil className='w-3 h-3 mr-1' />
                                        Edit
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Thumbnail + Content Row */}
                <div className='flex flex-col sm:flex-row gap-4'>
                    {/* Thumbnail - With edit overlay */}
                    <div className='w-full sm:w-[304px] aspect-video sm:aspect-auto sm:flex-shrink-0 sm:h-[171px] pt-4 relative'>
                        {thumbnailUrl ? (
                            <div className='relative w-full h-full'>
                                <Image
                                    src={thumbnailUrl}
                                    alt={title || 'Thumbnail'}
                                    fill
                                    loading='lazy'
                                    className='object-contain rounded'
                                />
                            </div>
                        ) : (
                            <div className='w-full h-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center'>
                                <span className='text-gray-400 text-sm'>
                                    No thumbnail
                                </span>
                            </div>
                        )}

                        {/* Edit overlay */}
                        {isEditing && (
                            <div className='absolute inset-0 bg-black/70 rounded flex flex-col items-center justify-center p-3 gap-2'>
                                <div className='w-full'>
                                    <span className='text-xs text-white mb-1 block'>
                                        Thumbnail URL
                                    </span>
                                    <div className='flex gap-2'>
                                        <input
                                            type='url'
                                            value={localThumbnailUrl}
                                            onChange={(e) =>
                                                handleThumbnailChange(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder='https://...'
                                            className='flex-1 px-2 py-1.5 text-sm rounded bg-white/90 text-black 
                                                       focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                        <Button
                                            type='button'
                                            variant='secondary'
                                            size='sm'
                                            className='px-2 h-auto'
                                            onClick={() =>
                                                setShowThumbnailPreview(
                                                    !showThumbnailPreview,
                                                )
                                            }
                                        >
                                            {showThumbnailPreview ? (
                                                <X className='w-3 h-3' />
                                            ) : (
                                                <Pencil className='w-3 h-3' />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {showThumbnailPreview && localThumbnailUrl && (
                                    <div className='w-full h-24 relative mt-2'>
                                        <Image
                                            src={localThumbnailUrl}
                                            alt='Preview'
                                            fill
                                            className='object-contain rounded bg-white'
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Metadata JSON display - Same in both modes */}
                    <div className='flex-1 min-w-0 w-full sm:w-auto sm:flex sm:items-center'>
                        <div className='rounded-lg p-4 font-mono w-full'>
                            <div className='text-sm'>
                                {'{'}
                                <div className='ml-4 space-y-1'>
                                    {metadata.map((item, index) => (
                                        <div key={item.key}>
                                            <span className='text-purple-600 dark:text-purple-400'>
                                                &quot;{item.key}&quot;
                                            </span>
                                            :{' '}
                                            <span
                                                className={
                                                    colorClasses[
                                                        item.color || 'green'
                                                    ]
                                                }
                                            >
                                                {typeof item.value === 'string'
                                                    ? `&quot;${item.value}&quot;`
                                                    : item.value}
                                            </span>
                                            {index < metadata.length - 1 && ','}
                                        </div>
                                    ))}
                                    {tags && tags.length > 0 && (
                                        <div>
                                            <span className='text-purple-600 dark:text-purple-400'>
                                                &quot;TAGS&quot;
                                            </span>
                                            :{' '}
                                            <span className='text-yellow-600 dark:text-yellow-400'>
                                                [
                                                {tags
                                                    .map(
                                                        (t) =>
                                                            `&quot;${t.name}&quot;`,
                                                    )
                                                    .join(', ')}
                                                ]
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {'}'}
                            </div>

                            {/* URL display */}
                            <div className='mt-4 pt-2 border-t border-gray-200 dark:border-gray-800'>
                                <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                    {url}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
