'use client'

import { Check, Globe, Loader2, Pencil, Plus, RotateCcw, X } from 'lucide-react'
import { useCallback, useState } from 'react'

import {
    type ActionConfig,
    MediaCard,
    type MediaMetadataItem,
    type StatusBadgeConfig,
} from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import type { CachedSeasonInfo } from '@/hooks/use-series'
import { ScheduleService } from '@/lib/services/schedule-service'
import { SeasonService } from '@/lib/services/season-service'
import type {
    ScheduleType,
    ScheduleValue,
    Season,
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
    /** Season cache for multi-season +1 (seriesId → CachedSeasonInfo) */
    seasonCache?: Map<number, CachedSeasonInfo>
    /** Cache a season selection for multi-season +1 */
    onCacheSeasonForIncrement?: (
        seriesId: number,
        seasonId: number,
        seasonNumber: number,
    ) => void
    /** Clear the cached season selection */
    onClearSeasonCache?: (seriesId: number) => void
    /** Increment progress for a specific season */
    onIncrementSeasonProgress?: (
        seriesId: number,
        seasonId: number,
    ) => Promise<boolean>
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
    const { episodesBehind } = computeEpisodeFields(series)
    const scheduleDisplay = ScheduleService.formatScheduleDisplay(
        series.scheduleType as ScheduleType,
        series.scheduleValue as ScheduleValue,
    )

    const metadata: MediaMetadataItem[] = [
        { key: 'ID', value: series.id, color: 'cyan' },
        { key: 'PLATFORM', value: series.platform, color: 'green' },
    ]

    metadata.push({
        key: 'TYPE',
        value: series.hasSeasons ? 'Multi-Season' : 'Single',
        color: 'purple',
    })

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
    seasonCache,
    onCacheSeasonForIncrement,
    onClearSeasonCache,
    onIncrementSeasonProgress,
    className,
}: SeriesCardProps) {
    const [loadingCatchUp, setLoadingCatchUp] = useState(false)
    const [loadingMarkWatched, setLoadingMarkWatched] = useState(false)
    const [loadingIncrement, setLoadingIncrement] = useState(false)
    const [loadingDelete, setLoadingDelete] = useState(false)

    // Season picker popover state (for multi-season +1)
    const [seasonPickerOpen, setSeasonPickerOpen] = useState(false)
    const [seasons, setSeasons] = useState<Season[]>([])
    const [loadingSeasons, setLoadingSeasons] = useState(false)

    const status = getSeriesStatus(series)
    const isBacklog = isBacklogSeries(series)

    // Multi-season helpers
    const isMultiSeason = series.hasSeasons
    const cachedSeason = seasonCache?.get(series.id)
    const hasCachedSeason = cachedSeason !== undefined
    const canIncrementSingleSeries = series.episodesWatched < series.episodesAired

    // Fetch seasons lazily when popover opens
    const handleOpenSeasonPicker = useCallback(async () => {
        setSeasonPickerOpen(true)
        setLoadingSeasons(true)
        try {
            const fetchedSeasons = await SeasonService.getAll(series.id)
            setSeasons(fetchedSeasons)
        } catch (err) {
            console.error('Failed to fetch seasons:', err)
        } finally {
            setLoadingSeasons(false)
        }
    }, [series.id])

    // Handle season selection from popover
    const handleSelectSeason = useCallback(
        async (seasonId: number, seasonNumber: number) => {
            setSeasonPickerOpen(false)
            onCacheSeasonForIncrement?.(series.id, seasonId, seasonNumber)

            // Immediately increment the selected season
            setLoadingIncrement(true)
            try {
                await onIncrementSeasonProgress?.(series.id, seasonId)
            } finally {
                setLoadingIncrement(false)
            }
        },
        [series.id, onCacheSeasonForIncrement, onIncrementSeasonProgress],
    )

    // Handle +1 click for multi-season with cached season
    const handleIncrementCachedSeason = useCallback(async () => {
        if (!cachedSeason || !onIncrementSeasonProgress) return
        setLoadingIncrement(true)
        try {
            await onIncrementSeasonProgress(series.id, cachedSeason.seasonId)
        } finally {
            setLoadingIncrement(false)
        }
    }, [series.id, cachedSeason, onIncrementSeasonProgress])

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
    if (!series.isWatched && series.episodesWatched < series.episodesAired) {
        if (isMultiSeason && onIncrementSeasonProgress) {
            // Multi-season: use cached season or open season picker
            if (hasCachedSeason) {
                primaryActions.push({
                    id: 'increment',
                    label: `+1 S${cachedSeason.seasonNumber}`,
                    onClick: handleIncrementCachedSeason,
                    variant: 'secondary',
                    icon: <Plus className='w-3 h-3' />,
                    loading: loadingIncrement,
                })
            } else {
                primaryActions.push({
                    id: 'increment',
                    label: '+1 Episode',
                    onClick: handleOpenSeasonPicker,
                    variant: 'secondary',
                    icon: <Plus className='w-3 h-3' />,
                    loading: loadingIncrement,
                })
            }
        } else if (onIncrementProgress && canIncrementSingleSeries) {
            // Single-mode: standard increment
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
    }

    // Build secondary actions
    const secondaryActions: ActionConfig[] = []

    // Clear cached season (for multi-season series with cached selection)
    if (isMultiSeason && hasCachedSeason && onClearSeasonCache) {
        secondaryActions.push({
            id: 'clear-season',
            label: `clearSeason(S${cachedSeason.seasonNumber})`,
            onClick: () => onClearSeasonCache(series.id),
            variant: 'ghost',
            icon: <X className='w-3 h-3' />,
        })
    }

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
        <Popover open={seasonPickerOpen} onOpenChange={setSeasonPickerOpen}>
            <PopoverAnchor asChild>
                <div>
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
                </div>
            </PopoverAnchor>
            <PopoverContent align='end' side='bottom' className='w-64 p-0'>
                <div className='p-3 border-b border-border'>
                    <h4 className='font-mono text-sm font-medium'>
                        Select Season
                    </h4>
                    <p className='text-xs text-muted-foreground mt-1'>
                        Choose which season to increment
                    </p>
                </div>
                <div className='p-2'>
                    {loadingSeasons ? (
                        <div className='flex items-center justify-center py-4'>
                            <Loader2 className='w-4 h-4 animate-spin text-muted-foreground' />
                        </div>
                    ) : seasons.length === 0 ? (
                        <p className='text-xs text-muted-foreground py-4 text-center'>
                            No seasons found
                        </p>
                    ) : (
                        <div className='space-y-1'>
                            {seasons.map((season) => {
                                const progress = `${season.episodesWatched}/${season.episodesAired}`
                                return (
                                    <Button
                                        key={season.id}
                                        variant='ghost'
                                        size='sm'
                                        className='w-full justify-between font-mono text-xs h-8'
                                        onClick={() =>
                                            handleSelectSeason(
                                                season.id,
                                                season.seasonNumber,
                                            )
                                        }
                                    >
                                        <span>
                                            Season {season.seasonNumber}
                                        </span>
                                        <span className='text-muted-foreground'>
                                            {progress}
                                        </span>
                                    </Button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
