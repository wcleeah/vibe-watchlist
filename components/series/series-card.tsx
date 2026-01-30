'use client'

import {
    CalendarDays,
    Check,
    ExternalLink,
    FileText,
    Loader2,
    Pencil,
    Plus,
    RotateCcw,
    Trash2,
} from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { ScheduleService } from '@/lib/services/schedule-service'
import { cn } from '@/lib/utils'
import type {
    ScheduleType,
    ScheduleValue,
    SeriesWithTags,
} from '@/types/series'
import {
    formatProgress,
    getSeriesStatus,
    isBacklogSeries,
    isSeriesComplete,
} from '@/types/series'

interface SeriesCardProps {
    series: SeriesWithTags
    onCatchUp?: (id: number) => Promise<void> // Reset missed periods for recurring
    onMarkWatched?: (id: number) => Promise<void> // Move to Watched tab
    onUnmarkWatched?: (id: number) => Promise<void> // Move back to Active tab
    onIncrementProgress?: (id: number) => Promise<boolean> // +1 episode, returns true if complete
    onDelete?: (id: number) => Promise<void>
    onEdit?: (series: SeriesWithTags) => void
    className?: string
}

function ThumbnailDisplay({
    series,
    className,
}: {
    series: SeriesWithTags
    className?: string
}) {
    if (!series.thumbnailUrl) {
        return (
            <div
                className={cn(
                    'w-full h-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center',
                    className,
                )}
            >
                <FileText className='w-6 h-6 text-gray-400' />
            </div>
        )
    }

    return (
        <div className={cn('relative w-full h-full', className)}>
            <Image
                src={series.thumbnailUrl}
                alt={series.title || 'Series thumbnail'}
                fill
                loading='lazy'
                className='object-contain rounded'
            />
        </div>
    )
}

function StatusBadge({ series }: { series: SeriesWithTags }) {
    const status = getSeriesStatus(series)
    const isComplete = isSeriesComplete(series)
    const progress = formatProgress(series)

    const statusConfig = {
        behind: {
            bg: 'bg-red-100 dark:bg-red-900/30',
            text: 'text-red-700 dark:text-red-400',
            border: 'border-red-300 dark:border-red-700',
        },
        'caught-up': {
            bg: 'bg-green-100 dark:bg-green-900/30',
            text: 'text-green-700 dark:text-green-400',
            border: 'border-green-300 dark:border-green-700',
        },
        ended: {
            bg: 'bg-gray-100 dark:bg-gray-800',
            text: 'text-gray-600 dark:text-gray-400',
            border: 'border-gray-300 dark:border-gray-600',
        },
        backlog: {
            bg: isComplete
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-blue-100 dark:bg-blue-900/30',
            text: isComplete
                ? 'text-green-700 dark:text-green-400'
                : 'text-blue-700 dark:text-blue-400',
            border: isComplete
                ? 'border-green-300 dark:border-green-700'
                : 'border-blue-300 dark:border-blue-700',
        },
    }

    const config = statusConfig[status]

    // Determine display text based on series type
    let displayText: string
    if (status === 'ended') {
        displayText = 'Ended'
    } else if (status === 'backlog') {
        displayText = isComplete ? 'Complete' : progress || 'Backlog'
    } else {
        displayText = ScheduleService.formatMissedPeriods(
            series.missedPeriods,
            series.scheduleType as ScheduleType,
            series.scheduleValue as ScheduleValue,
        )
    }

    return (
        <span
            className={cn(
                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
                config.bg,
                config.text,
                config.border,
            )}
        >
            {displayText}
        </span>
    )
}

export function SeriesCard({
    series,
    onCatchUp,
    onMarkWatched,
    onUnmarkWatched,
    onIncrementProgress,
    onDelete,
    onEdit,
    className,
}: SeriesCardProps) {
    const [loadingCatchUp, setLoadingCatchUp] = useState(false)
    const [loadingMarkWatched, setLoadingMarkWatched] = useState(false)
    const [loadingIncrement, setLoadingIncrement] = useState(false)
    const [loadingDelete, setLoadingDelete] = useState(false)

    const scheduleDisplay = ScheduleService.formatScheduleDisplay(
        series.scheduleType as ScheduleType,
        series.scheduleValue as ScheduleValue,
    )

    const status = getSeriesStatus(series)
    const isBacklog = isBacklogSeries(series)
    const progress = formatProgress(series)

    return (
        <div
            className={cn(
                'bg-white dark:bg-black rounded-lg border border-black dark:border-white',
                className,
            )}
        >
            <div className='grid grid-cols-1 md:grid-cols-[8fr_2fr] min-h-[240px]'>
                {/* Content Column */}
                <div className='px-4 pt-4 pb-4 space-y-1 max-w-full overflow-hidden'>
                    {/* Title + Status Badge */}
                    <div className='pb-2 border-b border-black dark:border-white'>
                        <div className='flex items-center justify-between gap-2'>
                            <h3
                                className='text-lg font-bold text-black dark:text-white font-mono truncate flex-1 min-w-0'
                                title={series.title || 'Untitled Series'}
                            >
                                {series.title || 'Untitled Series'}
                            </h3>
                            <StatusBadge series={series} />
                        </div>
                    </div>

                    {/* Thumbnail + Content Row */}
                    <div className='flex flex-col sm:flex-row gap-4'>
                        {/* Thumbnail */}
                        <div className='w-full sm:w-[304px] aspect-video sm:aspect-auto sm:flex-shrink-0 sm:h-[171px] pt-4'>
                            <ThumbnailDisplay series={series} />
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
                                                {series.id}
                                            </span>
                                            ,
                                        </div>
                                        <div>
                                            <span className='text-purple-600 dark:text-purple-400'>
                                                &quot;PLATFORM&quot;
                                            </span>
                                            :{' '}
                                            <span className='text-green-600 dark:text-green-400'>
                                                &quot;{series.platform}&quot;
                                            </span>
                                            ,
                                        </div>
                                        <div className='flex items-center gap-1'>
                                            <span className='text-purple-600 dark:text-purple-400'>
                                                &quot;
                                                <CalendarDays className='w-3 h-3 text-orange-500 inline' />{' '}
                                                SCHEDULE&quot;
                                            </span>
                                            :{' '}
                                            <span className='text-orange-600 dark:text-orange-400'>
                                                &quot;{scheduleDisplay}&quot;
                                            </span>
                                            ,
                                        </div>
                                        {/* Show MISSED only for recurring series */}
                                        {!isBacklog && (
                                            <div>
                                                <span className='text-purple-600 dark:text-purple-400'>
                                                    &quot;MISSED&quot;
                                                </span>
                                                :{' '}
                                                <span
                                                    className={cn(
                                                        series.missedPeriods > 0
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-green-600 dark:text-green-400',
                                                    )}
                                                >
                                                    {series.missedPeriods}
                                                </span>
                                                ,
                                            </div>
                                        )}
                                        {/* Show PROGRESS for series with episode tracking */}
                                        {progress && (
                                            <div>
                                                <span className='text-purple-600 dark:text-purple-400'>
                                                    &quot;PROGRESS&quot;
                                                </span>
                                                :{' '}
                                                <span
                                                    className={cn(
                                                        isSeriesComplete(series)
                                                            ? 'text-green-600 dark:text-green-400'
                                                            : 'text-blue-600 dark:text-blue-400',
                                                    )}
                                                >
                                                    &quot;{progress}&quot;
                                                </span>
                                                ,
                                            </div>
                                        )}
                                        {series.tags &&
                                            series.tags.length > 0 && (
                                                <div>
                                                    <span className='text-purple-600 dark:text-purple-400'>
                                                        &quot;TAGS&quot;
                                                    </span>
                                                    :{' '}
                                                    <span className='text-yellow-600 dark:text-yellow-400'>
                                                        [
                                                        {series.tags
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

                {/* Action Column */}
                <div className='px-4 pt-4 pb-4 flex flex-col md:border-l border-black dark:border-white justify-center'>
                    <div className='flex flex-col gap-2 justify-center mb-8'>
                        {/* Watch link */}
                        <a
                            href={series.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='w-full h-8 min-h-[44px] text-xs px-2 bg-primary text-primary-foreground dark:bg-white dark:text-black hover:bg-primary/90 dark:hover:bg-gray-100 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center font-bold'
                            title='watch()'
                            aria-label='Watch series'
                        >
                            <ExternalLink className='w-3 h-3 mr-1' />
                            watch()
                        </a>

                        {/* Copy URL */}
                        <button
                            type='button'
                            onClick={() =>
                                navigator.clipboard.writeText(series.url)
                            }
                            className='w-full h-8 min-h-[44px] text-xs px-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center'
                            title='copyUrl()'
                            aria-label='Copy series URL'
                        >
                            copyUrl()
                        </button>

                        {/* Edit button */}
                        {onEdit && (
                            <button
                                type='button'
                                onClick={() => onEdit(series)}
                                className='w-full h-8 min-h-[44px] text-xs px-2 bg-purple-500 text-white hover:bg-purple-600 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center'
                                title='edit()'
                                aria-label='Edit series'
                            >
                                <Pencil className='w-3 h-3 mr-1' />
                                edit()
                            </button>
                        )}

                        {/* Increment progress button - for backlog series */}
                        {onIncrementProgress &&
                            isBacklog &&
                            !series.isWatched && (
                                <button
                                    type='button'
                                    onClick={async () => {
                                        setLoadingIncrement(true)
                                        try {
                                            await onIncrementProgress(series.id)
                                        } finally {
                                            setLoadingIncrement(false)
                                        }
                                    }}
                                    disabled={loadingIncrement}
                                    className='w-full h-8 min-h-[44px] text-xs px-2 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center'
                                    title='increment()'
                                    aria-label='Increment episode count'
                                >
                                    {loadingIncrement ? (
                                        <Loader2 className='w-4 h-4 animate-spin' />
                                    ) : (
                                        <>
                                            <Plus className='w-3 h-3 mr-1' />
                                            +1 Episode
                                        </>
                                    )}
                                </button>
                            )}

                        {/* Catch up button - for recurring series with missed periods */}
                        {onCatchUp &&
                            !isBacklog &&
                            status !== 'ended' &&
                            !series.isWatched && (
                                <button
                                    type='button'
                                    onClick={async () => {
                                        setLoadingCatchUp(true)
                                        try {
                                            await onCatchUp(series.id)
                                        } finally {
                                            setLoadingCatchUp(false)
                                        }
                                    }}
                                    disabled={
                                        loadingCatchUp ||
                                        series.missedPeriods === 0
                                    }
                                    className={cn(
                                        'w-full h-8 min-h-[44px] text-xs px-2 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center',
                                        series.missedPeriods > 0
                                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed',
                                    )}
                                    title='catchUp()'
                                    aria-label='Mark as caught up'
                                >
                                    {loadingCatchUp ? (
                                        <Loader2 className='w-4 h-4 animate-spin' />
                                    ) : (
                                        'catchUp()'
                                    )}
                                </button>
                            )}

                        {/* Mark as watched button - move to Watched tab */}
                        {onMarkWatched && !series.isWatched && (
                            <button
                                type='button'
                                onClick={async () => {
                                    setLoadingMarkWatched(true)
                                    try {
                                        await onMarkWatched(series.id)
                                    } finally {
                                        setLoadingMarkWatched(false)
                                    }
                                }}
                                disabled={loadingMarkWatched}
                                className='w-full h-8 min-h-[44px] text-xs px-2 bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center'
                                title='markWatched()'
                                aria-label='Mark series as watched'
                            >
                                {loadingMarkWatched ? (
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                    <>
                                        <Check className='w-3 h-3 mr-1' />
                                        markWatched()
                                    </>
                                )}
                            </button>
                        )}

                        {/* Unmark watched button - move back to Active tab */}
                        {onUnmarkWatched && series.isWatched && (
                            <button
                                type='button'
                                onClick={async () => {
                                    setLoadingMarkWatched(true)
                                    try {
                                        await onUnmarkWatched(series.id)
                                    } finally {
                                        setLoadingMarkWatched(false)
                                    }
                                }}
                                disabled={loadingMarkWatched}
                                className='w-full h-8 min-h-[44px] text-xs px-2 bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center'
                                title='unmarkWatched()'
                                aria-label='Move back to active'
                            >
                                {loadingMarkWatched ? (
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                    <>
                                        <RotateCcw className='w-3 h-3 mr-1' />
                                        unmarkWatched()
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Delete button */}
                    {onDelete && (
                        <div className='flex justify-center'>
                            <button
                                type='button'
                                onClick={async () => {
                                    setLoadingDelete(true)
                                    try {
                                        await onDelete(series.id)
                                    } finally {
                                        setLoadingDelete(false)
                                    }
                                }}
                                disabled={loadingDelete}
                                className='w-full h-8 min-h-[44px] text-xs px-2 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center'
                                title='delete()'
                                aria-label='Delete series'
                            >
                                {loadingDelete ? (
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
