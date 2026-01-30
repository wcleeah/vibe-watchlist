'use client'

import { CalendarDays } from 'lucide-react'

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
    loading?: boolean
}

export function SeriesList({
    series,
    onCatchUp,
    onMarkWatched,
    onUnmarkWatched,
    onIncrementProgress,
    onDelete,
    onEdit,
    loading = false,
}: SeriesListProps) {
    if (loading) {
        return (
            <div className='text-center py-12'>
                <div className='w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center animate-pulse'>
                    <CalendarDays className='w-6 h-6 text-gray-400' />
                </div>
                <h3 className='text-base font-medium mb-1 font-mono'>
                    Loading series...
                </h3>
            </div>
        )
    }

    if (series.length === 0) {
        return (
            <div className='text-center py-12'>
                <div className='w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center'>
                    <CalendarDays className='w-6 h-6 text-gray-400' />
                </div>
                <h3 className='text-base font-medium mb-1 font-mono'>
                    No series found
                </h3>
                <p className='text-sm text-gray-500 dark:text-gray-400 font-mono'>
                    {'//'} Add a series from the home page to track recurring
                    content
                </p>
            </div>
        )
    }

    return (
        <div className='overflow-hidden'>
            {series.map((s) => (
                <div key={s.id} className='py-3'>
                    <SeriesCard
                        series={s}
                        onCatchUp={onCatchUp}
                        onMarkWatched={onMarkWatched}
                        onUnmarkWatched={onUnmarkWatched}
                        onIncrementProgress={onIncrementProgress}
                        onDelete={onDelete}
                        onEdit={onEdit}
                    />
                </div>
            ))}
        </div>
    )
}
