import { X } from 'lucide-react'
import type React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TagProps {
    id: number
    name: string
    color?: string | null
    onRemove?: (tagId: number) => void
    className?: string
    size?: 'sm' | 'default'
}

export function Tag({
    id,
    name,
    color = '#6b7280',
    onRemove,
    className,
    size = 'default',
}: TagProps) {
    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation()
        onRemove?.(id)
    }

    const tagColor = color || '#6b7280'

    return (
        <Badge
            variant='secondary'
            className={cn(
                'inline-flex items-center gap-1 font-medium',
                size === 'sm' && 'text-xs px-2 py-0.5',
                className,
            )}
            style={{
                backgroundColor: `${tagColor}20`, // Add transparency
                borderColor: tagColor,
                color: tagColor,
            }}
        >
            {name.includes('<mark>') ? (
                <span dangerouslySetInnerHTML={{ __html: name }} />
            ) : (
                <span>{name}</span>
            )}
            {onRemove && (
                <button
                    onClick={handleRemove}
                    className='ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors'
                    aria-label={`Remove ${name.replace(/<[^>]*>/g, '')} tag`}
                >
                    <X className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
                </button>
            )}
        </Badge>
    )
}

interface TagListProps {
    tags: Array<{
        id: number
        name: string
        color?: string | null
    }>
    onRemove?: (tagId: number) => void
    className?: string
    size?: 'sm' | 'default'
    maxVisible?: number
}

export function TagList({
    tags,
    onRemove,
    className,
    size = 'default',
    maxVisible,
}: TagListProps) {
    if (!tags || tags.length === 0) {
        return null
    }

    const visibleTags = maxVisible ? tags.slice(0, maxVisible) : tags
    const hiddenCount = maxVisible ? Math.max(0, tags.length - maxVisible) : 0

    return (
        <div className={cn('flex flex-wrap gap-1', className)}>
            {visibleTags.map((tag) => (
                <Tag
                    key={tag.id}
                    id={tag.id}
                    name={tag.name}
                    color={tag.color}
                    onRemove={onRemove}
                    size={size}
                />
            ))}
            {hiddenCount > 0 && (
                <Badge
                    variant='outline'
                    className={cn(
                        'font-medium',
                        size === 'sm' && 'text-xs px-2 py-0.5',
                    )}
                >
                    +{hiddenCount} more
                </Badge>
            )}
        </div>
    )
}
