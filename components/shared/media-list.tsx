'use client'

import { Inbox } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface MediaListProps<T> {
    items: T[]
    renderCard: (item: T) => React.ReactNode
    keyExtractor?: (item: T, index: number) => string | number
    loading?: boolean
    loadingSkeletonCount?: number
    emptyState?: {
        title: string
        description: string
        icon?: React.ReactNode
    }
    className?: string
}

export function MediaList<T>({
    items,
    renderCard,
    keyExtractor,
    loading = false,
    loadingSkeletonCount = 3,
    emptyState,
    className,
}: MediaListProps<T>) {
    // Loading state
    if (loading) {
        return (
            <div className={cn('space-y-6', className)}>
                {[...Array(loadingSkeletonCount)].map((_, i) => (
                    <div key={i} className='animate-pulse'>
                        <div className='bg-gray-200 dark:bg-gray-800 rounded-lg h-[240px]' />
                    </div>
                ))}
            </div>
        )
    }

    // Empty state
    if (items.length === 0) {
        return (
            <div className='flex flex-col items-center justify-center py-16 text-center'>
                {emptyState?.icon || (
                    <Inbox className='w-16 h-16 text-gray-300 dark:text-gray-700 mb-4' />
                )}
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                    {emptyState?.title || 'No items found'}
                </h3>
                <p className='text-gray-500 dark:text-gray-400 max-w-md'>
                    {emptyState?.description ||
                        'There are no items to display.'}
                </p>
            </div>
        )
    }

    // List of items
    return (
        <div className={cn('space-y-6', className)}>
            {items.map((item, index) => (
                <div key={keyExtractor ? keyExtractor(item, index) : index}>
                    {renderCard(item)}
                </div>
            ))}
        </div>
    )
}
