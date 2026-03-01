'use client'

import { Clock } from 'lucide-react'

import { MediaList, SortableMediaList } from '@/components/shared'

import type { ComingSoonWithTags } from '@/types/coming-soon'

import { ComingSoonCard } from './coming-soon-card'

interface ComingSoonListProps {
    items: ComingSoonWithTags[]
    loading?: boolean
    onEdit?: (item: ComingSoonWithTags) => void
    onDelete?: (id: number) => Promise<void>
    onTransform?: (item: ComingSoonWithTags) => void
    onRefreshMetadata?: (item: ComingSoonWithTags) => void
    onReorder?: (orderedIds: number[]) => Promise<void>
    emptyState?: {
        title: string
        description: string
    }
}

export function ComingSoonList({
    items,
    loading = false,
    onEdit,
    onDelete,
    onTransform,
    onRefreshMetadata,
    onReorder,
    emptyState,
}: ComingSoonListProps) {
    const renderCard = (item: ComingSoonWithTags) => (
        <ComingSoonCard
            item={item}
            onEdit={onEdit ? () => onEdit(item) : undefined}
            onDelete={onDelete}
            onTransform={onTransform ? () => onTransform(item) : undefined}
            onRefreshMetadata={
                onRefreshMetadata ? () => onRefreshMetadata(item) : undefined
            }
        />
    )

    const emptyStateConfig = {
        title: emptyState?.title || 'No coming soon items',
        description:
            emptyState?.description ||
            'Add upcoming content to track release dates',
        icon: (
            <Clock className='w-16 h-16 text-gray-300 dark:text-gray-700 mb-4' />
        ),
    }

    // If onReorder is provided, use SortableMediaList for drag-and-drop
    if (onReorder) {
        return (
            <SortableMediaList
                items={items}
                renderCard={renderCard}
                keyExtractor={(item) => item.id}
                onReorder={onReorder}
                loading={loading}
                emptyState={emptyStateConfig}
            />
        )
    }

    // Otherwise use regular MediaList (read-only mode)
    return (
        <MediaList
            items={items}
            renderCard={renderCard}
            keyExtractor={(item) => item.id}
            loading={loading}
            emptyState={emptyStateConfig}
        />
    )
}
