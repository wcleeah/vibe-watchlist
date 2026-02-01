'use client'

import type { DragEndEvent } from '@dnd-kit/core'

import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Inbox } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

import { SortableItem } from './sortable-item'

export interface SortableMediaListProps<T> {
    items: T[]
    renderCard: (item: T) => React.ReactNode
    keyExtractor: (item: T) => number
    onReorder: (orderedIds: number[]) => Promise<void>
    loading?: boolean
    loadingSkeletonCount?: number
    emptyState?: {
        title: string
        description: string
        icon?: React.ReactNode
    }
    className?: string
}

export function SortableMediaList<T>({
    items,
    renderCard,
    keyExtractor,
    onReorder,
    loading = false,
    loadingSkeletonCount = 3,
    emptyState,
    className,
}: SortableMediaListProps<T>) {
    const [isReordering, setIsReordering] = useState(false)
    const [localItems, setLocalItems] = useState<T[]>(items)

    // Sync local items when props change (but not during reorder)
    useEffect(() => {
        if (!isReordering) {
            setLocalItems(items)
        }
    }, [items, isReordering])

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    )

    // Custom screen reader announcements for better accessibility
    const announcements = {
        onDragStart({ active }: { active: { id: string | number } }) {
            const position =
                localItems.findIndex(
                    (item) => keyExtractor(item) === active.id,
                ) + 1
            return `Picked up item at position ${position} of ${localItems.length}. Use arrow keys to move, space to drop, escape to cancel.`
        },
        onDragOver({
            active,
            over,
        }: {
            active: { id: string | number }
            over: { id: string | number } | null
        }) {
            if (over) {
                const overPosition =
                    localItems.findIndex(
                        (item) => keyExtractor(item) === over.id,
                    ) + 1
                return `Item moved to position ${overPosition} of ${localItems.length}`
            }
            return 'Item is no longer over a droppable area'
        },
        onDragEnd({
            active,
            over,
        }: {
            active: { id: string | number }
            over: { id: string | number } | null
        }) {
            if (over) {
                const finalPosition =
                    localItems.findIndex(
                        (item) => keyExtractor(item) === over.id,
                    ) + 1
                return `Item dropped at position ${finalPosition} of ${localItems.length}`
            }
            return 'Item dropped'
        },
        onDragCancel() {
            return 'Dragging cancelled. Item returned to original position.'
        },
    }

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event

            if (!over || active.id === over.id) return

            const oldIndex = localItems.findIndex(
                (item) => keyExtractor(item) === active.id,
            )
            const newIndex = localItems.findIndex(
                (item) => keyExtractor(item) === over.id,
            )

            if (oldIndex === -1 || newIndex === -1) return

            // Optimistic update - reorder items locally
            const newItems = [...localItems]
            const [movedItem] = newItems.splice(oldIndex, 1)
            newItems.splice(newIndex, 0, movedItem)
            setLocalItems(newItems)

            // API call with loading state
            setIsReordering(true)
            const toastId = toast.loading('Saving new order...')

            try {
                const orderedIds = newItems.map(keyExtractor)
                await onReorder(orderedIds)
                toast.success('Order saved', { id: toastId })
            } catch (error) {
                // Revert on error
                setLocalItems(items)
                toast.error('Failed to save order. Reverted changes.', {
                    id: toastId,
                })
                console.error('Reorder failed:', error)
            } finally {
                setIsReordering(false)
            }
        },
        [localItems, items, keyExtractor, onReorder],
    )

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
    if (localItems.length === 0) {
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

    const itemIds = localItems.map(keyExtractor)

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
            accessibility={{ announcements }}
        >
            <SortableContext
                items={itemIds}
                strategy={verticalListSortingStrategy}
            >
                <div className={cn('space-y-6', className)}>
                    {localItems.map((item) => (
                        <SortableItem
                            key={keyExtractor(item)}
                            id={keyExtractor(item)}
                            disabled={isReordering}
                        >
                            {renderCard(item)}
                        </SortableItem>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}
