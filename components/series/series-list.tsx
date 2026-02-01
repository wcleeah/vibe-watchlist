'use client'

import { CalendarDays } from 'lucide-react'

import { MediaList, SortableMediaList } from '@/components/shared'

import type { SeriesWithTags } from '@/types/series'

import { SeriesCard } from './series-card'

interface SeriesListProps {
    series: SeriesWithTags[]
    onCatchUp?: (id: number) => Promise<void>
    onMarkWatched?: (id: number) => Promise<void>
    onUnmarkWatched?: (id: number) => Promise<void>
    onIncrementProgress?: (id: number) => Promise<boolean>
    onDelete?: (id: number) => Promise<void>
    onEdit?: (series: SeriesWithTags) => void
    onReorder?: (orderedIds: number[]) => Promise<void>
    loading?: boolean
    emptyState?: {
        title: string
        description: string
    }
}

export function SeriesList({
    series,
    onCatchUp,
    onMarkWatched,
    onUnmarkWatched,
    onIncrementProgress,
    onDelete,
    onEdit,
    onReorder,
    loading = false,
    emptyState,
}: SeriesListProps) {
    const renderCard = (s: SeriesWithTags) => (
        <SeriesCard
            series={s}
            onCatchUp={onCatchUp}
            onMarkWatched={onMarkWatched}
            onUnmarkWatched={onUnmarkWatched}
            onIncrementProgress={onIncrementProgress}
            onDelete={onDelete}
            onEdit={onEdit}
        />
    )

    const emptyStateConfig = {
        title: emptyState?.title || 'No series found',
        description:
            emptyState?.description ||
            'Add a series from the home page to track recurring content',
        icon: (
            <CalendarDays className='w-16 h-16 text-gray-300 dark:text-gray-700 mb-4' />
        ),
    }

    // If onReorder is provided, use SortableMediaList for drag-and-drop
    if (onReorder) {
        return (
            <SortableMediaList
                items={series}
                renderCard={renderCard}
                keyExtractor={(s) => s.id}
                onReorder={onReorder}
                loading={loading}
                emptyState={emptyStateConfig}
            />
        )
    }

    // Otherwise use regular MediaList (read-only mode)
    return (
        <MediaList
            items={series}
            renderCard={renderCard}
            keyExtractor={(s) => s.id}
            loading={loading}
            emptyState={emptyStateConfig}
        />
    )
}
