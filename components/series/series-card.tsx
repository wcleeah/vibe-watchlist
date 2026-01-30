'use client'

import { Check, Pencil, Plus, RotateCcw } from 'lucide-react'
import { useState } from 'react'

import {
    type ActionConfig,
    MediaCard,
    type MediaMetadataItem,
    type StatusBadgeConfig,
} from '@/components/shared'
import { ScheduleService } from '@/lib/services/schedule-service'
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
    onCatchUp?: (id: number) => Promise<void>
    onMarkWatched?: (id: number) => Promise<void>
    onUnmarkWatched?: (id: number) => Promise<void>
    onIncrementProgress?: (id: number) => Promise<boolean>
    onDelete?: (id: number) => Promise<void>
    onEdit?: (series: SeriesWithTags) => void
    className?: string
}

/**
 * Get status badge configuration for series
 */
function getStatusBadge(series: SeriesWithTags): StatusBadgeConfig {
    const status = getSeriesStatus(series)
    const isComplete = isSeriesComplete(series)
    const progress = formatProgress(series)

    // Determine badge variant
    let variant: StatusBadgeConfig['variant']
    if (status === 'ended') {
        variant = 'neutral'
    } else if (status === 'backlog') {
        variant = isComplete ? 'success' : 'info'
    } else if (status === 'behind') {
        variant = 'error'
    } else {
        variant = 'success'
    }

    // Determine display text
    let text: string
    if (status === 'ended') {
        text = 'Ended'
    } else if (status === 'backlog') {
        text = isComplete ? 'Complete' : progress || 'Backlog'
    } else {
        text = ScheduleService.formatMissedPeriods(
            series.missedPeriods,
            series.scheduleType as ScheduleType,
            series.scheduleValue as ScheduleValue,
        )
    }

    return { text, variant }
}

/**
 * Build metadata items for series card
 */
function buildMetadata(series: SeriesWithTags): MediaMetadataItem[] {
    const isBacklog = isBacklogSeries(series)
    const progress = formatProgress(series)
    const scheduleDisplay = ScheduleService.formatScheduleDisplay(
        series.scheduleType as ScheduleType,
        series.scheduleValue as ScheduleValue,
    )

    const metadata: MediaMetadataItem[] = [
        { key: 'ID', value: series.id, color: 'cyan' },
        { key: 'PLATFORM', value: series.platform, color: 'green' },
        { key: 'SCHEDULE', value: scheduleDisplay, color: 'orange' },
    ]

    // Show MISSED only for recurring series
    if (!isBacklog) {
        metadata.push({
            key: 'MISSED',
            value: series.missedPeriods,
            color: series.missedPeriods > 0 ? 'red' : 'green',
        })
    }

    // Show PROGRESS for series with episode tracking
    if (progress) {
        metadata.push({
            key: 'PROGRESS',
            value: progress,
            color: isSeriesComplete(series) ? 'green' : 'blue',
        })
    }

    return metadata
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

    const status = getSeriesStatus(series)
    const isBacklog = isBacklogSeries(series)

    // Build primary actions
    const primaryActions: ActionConfig[] = [
        {
            id: 'watch',
            label: 'watch()',
            href: series.url,
            variant: 'primary',
        },
    ]

    // Mark watched / unmark watched
    if (onMarkWatched && !series.isWatched) {
        primaryActions.push({
            id: 'mark-watched',
            label: 'markWatched()',
            onClick: async () => {
                setLoadingMarkWatched(true)
                try {
                    await onMarkWatched(series.id)
                } finally {
                    setLoadingMarkWatched(false)
                }
            },
            variant: 'secondary',
            icon: <Check className='w-3 h-3' />,
            loading: loadingMarkWatched,
        })
    }

    if (onUnmarkWatched && series.isWatched) {
        primaryActions.push({
            id: 'unmark-watched',
            label: 'unmarkWatched()',
            onClick: async () => {
                setLoadingMarkWatched(true)
                try {
                    await onUnmarkWatched(series.id)
                } finally {
                    setLoadingMarkWatched(false)
                }
            },
            variant: 'secondary',
            icon: <RotateCcw className='w-3 h-3' />,
            loading: loadingMarkWatched,
        })
    }

    // Increment progress for backlog series
    if (onIncrementProgress && isBacklog && !series.isWatched) {
        primaryActions.push({
            id: 'increment',
            label: '+1 Episode',
            onClick: async () => {
                setLoadingIncrement(true)
                try {
                    await onIncrementProgress(series.id)
                } finally {
                    setLoadingIncrement(false)
                }
            },
            variant: 'secondary',
            icon: <Plus className='w-3 h-3' />,
            loading: loadingIncrement,
        })
    }

    // Build secondary actions
    const secondaryActions: ActionConfig[] = []

    if (onEdit) {
        secondaryActions.push({
            id: 'edit',
            label: 'edit()',
            onClick: () => onEdit(series),
            variant: 'ghost',
            icon: <Pencil className='w-3 h-3' />,
        })
    }

    // Catch up for recurring series with missed periods
    if (onCatchUp && !isBacklog && status !== 'ended' && !series.isWatched) {
        secondaryActions.push({
            id: 'catch-up',
            label: 'catchUp()',
            onClick: async () => {
                setLoadingCatchUp(true)
                try {
                    await onCatchUp(series.id)
                } finally {
                    setLoadingCatchUp(false)
                }
            },
            variant: 'ghost',
            loading: loadingCatchUp,
            condition: series.missedPeriods > 0,
        })
    }

    // Delete action
    if (onDelete) {
        secondaryActions.push({
            id: 'delete',
            label: 'delete()',
            onClick: async () => {
                setLoadingDelete(true)
                try {
                    await onDelete(series.id)
                } finally {
                    setLoadingDelete(false)
                }
            },
            variant: 'danger',
            loading: loadingDelete,
        })
    }

    // Calculate progress for backlog series
    const showProgress =
        isBacklog &&
        series.totalEpisodes !== null &&
        series.totalEpisodes !== undefined &&
        series.totalEpisodes > 0
    const progressCurrent = series.watchedEpisodes || 0
    const progressTotal = series.totalEpisodes || 0

    return (
        <MediaCard
            item={series}
            title={series.title || 'Untitled Series'}
            thumbnailUrl={series.thumbnailUrl}
            url={series.url}
            tags={series.tags}
            metadata={buildMetadata(series)}
            primaryActions={primaryActions}
            secondaryActions={secondaryActions}
            statusBadge={getStatusBadge(series)}
            showProgress={showProgress}
            progressCurrent={progressCurrent}
            progressTotal={progressTotal}
            className={className}
        />
    )
}
