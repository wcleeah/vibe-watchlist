'use client'

import { Check, Globe, Pencil, Plus, RotateCcw } from 'lucide-react'
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
    computeEpisodeFields,
    formatProgress,
    getSeriesStatus,
    getSeriesStatuses,
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
    onRefreshMetadata?: (series: SeriesWithTags) => void
    className?: string
}

/**
 * Get status badge configuration for series.
 * A series can show multiple statuses (e.g. ended + behind).
 */
function getStatusBadge(series: SeriesWithTags): StatusBadgeConfig {
    const statuses = getSeriesStatuses(series)
    const isComplete = isSeriesComplete(series)
    const progress = formatProgress(series)
    const { episodesBehind } = computeEpisodeFields(series)

    // Determine badge variant based on primary status
    let variant: StatusBadgeConfig['variant']
    if (statuses.includes('behind')) {
        variant = 'error'
    } else if (statuses.includes('ended')) {
        variant = 'neutral'
    } else if (statuses.includes('backlog')) {
        variant = isComplete ? 'success' : 'info'
    } else {
        variant = 'success'
    }

    // Determine display text
    let text: string
    if (statuses.includes('backlog')) {
        text = isComplete ? 'Complete' : progress || 'Backlog'
    } else if (episodesBehind > 0) {
        const suffix = statuses.includes('ended') ? ' (Ended)' : ''
        text = `${episodesBehind} Behind${suffix}`
    } else if (statuses.includes('ended')) {
        text = 'Ended'
    } else {
        text = 'Caught Up'
    }

    return { text, variant }
}

/**
 * Build metadata items for series card
 */
function buildMetadata(series: SeriesWithTags): MediaMetadataItem[] {
    const isBacklog = isBacklogSeries(series)
    const progress = formatProgress(series)
    const { episodesBehind } = computeEpisodeFields(series)
    const scheduleDisplay = ScheduleService.formatScheduleDisplay(
        series.scheduleType as ScheduleType,
        series.scheduleValue as ScheduleValue,
    )

    const metadata: MediaMetadataItem[] = [
        { key: 'ID', value: series.id, color: 'cyan' },
        { key: 'PLATFORM', value: series.platform, color: 'green' },
    ]

    // Show "Multi-Season" type indicator for series with seasons
    if (series.hasSeasons) {
        metadata.push({ key: 'TYPE', value: 'Multi-Season', color: 'purple' })
    }

    metadata.push({
        key: 'SCHEDULE',
        value: scheduleDisplay,
        color: 'orange',
    })

    // Show BEHIND only for recurring series
    if (!isBacklog) {
        metadata.push({
            key: 'BEHIND',
            value: episodesBehind,
            color: episodesBehind > 0 ? 'red' : 'green',
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
    onRefreshMetadata,
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

    // Increment progress for any non-watched series (per spec: available for ALL)
    if (onIncrementProgress && !series.isWatched) {
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

    if (onRefreshMetadata) {
        secondaryActions.push({
            id: 'refresh-metadata',
            label: 'refreshMetadata()',
            onClick: () => onRefreshMetadata(series),
            variant: 'ghost',
            icon: <Globe className='w-3 h-3' />,
        })
    }

    // Catch up for recurring series that are behind
    if (onCatchUp && !isBacklog && status !== 'ended' && !series.isWatched) {
        const { episodesBehind } = computeEpisodeFields(series)
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
            condition: episodesBehind > 0,
        })
    }

    // Delete action - always visible
    const deleteAction: ActionConfig | undefined = onDelete
        ? {
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
          }
        : undefined

    // Calculate progress for series with known episode count
    const computed = computeEpisodeFields(series)
    const showProgress =
        computed.episodesTotal > 0 ||
        (series.episodesAired > 0 && series.episodesRemaining !== null)
    const progressCurrent = series.episodesWatched
    const progressTotal = computed.episodesTotal

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
            deleteAction={deleteAction}
            statusBadge={getStatusBadge(series)}
            showProgress={showProgress}
            progressCurrent={progressCurrent}
            progressTotal={progressTotal}
            className={className}
        />
    )
}
