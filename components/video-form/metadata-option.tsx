'use client'

import { Check } from 'lucide-react'
import type { MetadataSuggestion } from '@/lib/types/ai-metadata'
import { cn } from '@/lib/utils'
import { ConfidenceIndicator } from './confidence-indicator'
import { PlatformBadge } from './platform-badge'

interface MetadataOptionProps {
    suggestion: MetadataSuggestion
    isSelected?: boolean
    onClick: () => void
    className?: string
}

export function MetadataOption({
    suggestion,
    isSelected = false,
    onClick,
    className,
}: MetadataOptionProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0',
                isSelected && 'bg-blue-50 border-blue-200',
                className,
            )}
        >
            <div className='flex items-center gap-3'>
                {/* Thumbnail */}
                {suggestion.thumbnailUrl && (
                    <img
                        src={suggestion.thumbnailUrl}
                        alt='Video thumbnail'
                        className='w-10 h-10 rounded object-cover flex-shrink-0'
                        onError={(e) => {
                            e.currentTarget.style.display = 'none'
                        }}
                    />
                )}

                {/* Content */}
                <div className='flex-1 min-w-0'>
                    {/* Title and confidence */}
                    <div className='flex items-start gap-2 mb-1'>
                        <h5
                            className='font-medium text-sm truncate flex-1'
                            title={suggestion.title}
                        >
                            {suggestion.title}
                        </h5>
                        <div className='flex items-center gap-1 flex-shrink-0'>
                            <ConfidenceIndicator
                                confidence={suggestion.confidence}
                                size='sm'
                                showLabel={false}
                            />
                            {isSelected && (
                                <Check className='w-4 h-4 text-blue-600' />
                            )}
                        </div>
                    </div>

                    {/* Platform and reasoning */}
                    <div className='flex items-center gap-2 text-xs text-gray-500'>
                        <PlatformBadge
                            platform={suggestion.platform}
                            size='sm'
                            variant='ghost'
                        />
                        {suggestion.reasoning && (
                            <span
                                className='truncate flex-1'
                                title={suggestion.reasoning}
                            >
                                • {suggestion.reasoning}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </button>
    )
}

// Compact version for use in grids or lists
interface MetadataOptionCompactProps
    extends Omit<MetadataOptionProps, 'className'> {
    layout?: 'horizontal' | 'vertical'
}

export function MetadataOptionCompact({
    suggestion,
    isSelected = false,
    onClick,
    layout = 'vertical',
}: MetadataOptionCompactProps) {
    const isHorizontal = layout === 'horizontal'

    return (
        <button
            onClick={onClick}
            className={cn(
                'group relative p-3 rounded-lg border transition-all hover:shadow-md',
                isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 bg-white hover:border-gray-300',
                isHorizontal ? 'flex items-center gap-3' : 'text-center',
            )}
        >
            {/* Selection indicator */}
            {isSelected && (
                <div className='absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center'>
                    <Check className='w-3 h-3 text-white' />
                </div>
            )}

            {/* Thumbnail */}
            {suggestion.thumbnailUrl && (
                <div
                    className={cn(
                        'relative overflow-hidden rounded',
                        isHorizontal
                            ? 'w-16 h-12 flex-shrink-0'
                            : 'w-full aspect-video mb-2',
                    )}
                >
                    <img
                        src={suggestion.thumbnailUrl}
                        alt='Video thumbnail'
                        className='w-full h-full object-cover'
                        onError={(e) => {
                            e.currentTarget.style.display = 'none'
                        }}
                    />
                </div>
            )}

            {/* Content */}
            <div className={cn(isHorizontal ? 'flex-1 min-w-0' : '')}>
                {/* Title */}
                <h5
                    className={cn(
                        'font-medium truncate',
                        isHorizontal ? 'text-sm mb-1' : 'text-xs mb-2',
                    )}
                    title={suggestion.title}
                >
                    {suggestion.title}
                </h5>

                {/* Platform and confidence */}
                <div
                    className={cn(
                        'flex items-center justify-center gap-1',
                        isHorizontal ? 'justify-start' : '',
                    )}
                >
                    <PlatformBadge
                        platform={suggestion.platform}
                        size='sm'
                        variant='ghost'
                    />
                    <ConfidenceIndicator
                        confidence={suggestion.confidence}
                        size='sm'
                        showLabel={false}
                    />
                </div>

                {/* Reasoning (only show in horizontal layout if space) */}
                {isHorizontal && suggestion.reasoning && (
                    <p
                        className='text-xs text-gray-500 truncate mt-1'
                        title={suggestion.reasoning}
                    >
                        {suggestion.reasoning}
                    </p>
                )}
            </div>
        </button>
    )
}
