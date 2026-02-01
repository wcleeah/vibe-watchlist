'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

import { cn } from '@/lib/utils'

interface SortableItemProps {
    id: string | number
    children: React.ReactNode
    disabled?: boolean
}

export function SortableItem({ id, children, disabled }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'relative flex items-stretch gap-2',
                isDragging && 'opacity-50 z-50',
            )}
        >
            {/* Drag handle - always visible */}
            <button
                type='button'
                {...attributes}
                {...listeners}
                disabled={disabled}
                className={cn(
                    'flex items-center justify-center w-8 shrink-0 rounded-md',
                    'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    'cursor-grab active:cursor-grabbing',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    'touch-none', // Prevent scroll interference on touch devices
                    disabled && 'cursor-not-allowed opacity-50',
                )}
                aria-label='Drag to reorder'
            >
                <GripVertical className='w-5 h-5' />
            </button>

            {/* Card content */}
            <div className='flex-1 min-w-0'>{children}</div>
        </div>
    )
}
