'use client'

import { ChevronDown, Copy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

import { ActionButton, type ActionVariant } from './action-button'
import { ProgressBar } from './progress-bar'
import { ThumbnailDisplay } from './thumbnail-display'

// Types
export interface MediaMetadataItem {
    key: string
    value: string | number
    color?: 'cyan' | 'purple' | 'green' | 'yellow' | 'blue' | 'red' | 'orange'
}

export interface ActionConfig {
    id: string
    label: string
    onClick?: () => void | Promise<void>
    href?: string
    icon?: React.ReactNode
    variant?: ActionVariant
    condition?: boolean
    loading?: boolean
}

export interface StatusBadgeConfig {
    text: string
    variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'
}

interface MediaCardProps<T> {
    item: T
    title: string
    thumbnailUrl: string | null
    url: string
    tags?: Array<{ id: number; name: string; color?: string | null }>
    metadata: MediaMetadataItem[]
    primaryActions: ActionConfig[]
    secondaryActions?: ActionConfig[]
    showProgress?: boolean
    progressCurrent?: number
    progressTotal?: number
    progressLabel?: string
    statusBadge?: StatusBadgeConfig
    error?: string | null
    className?: string
    children?: React.ReactNode
    /** If true, hide action column entirely (preview mode) */
    hideActions?: boolean
}

const colorClasses: Record<string, string> = {
    cyan: 'text-cyan-600 dark:text-cyan-400',
    purple: 'text-purple-600 dark:text-purple-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    blue: 'text-blue-600 dark:text-blue-400',
    red: 'text-red-600 dark:text-red-400',
    orange: 'text-orange-600 dark:text-orange-400',
}

const badgeVariantClasses: Record<
    string,
    { bg: string; text: string; border: string }
> = {
    success: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-300 dark:border-green-700',
    },
    warning: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-300 dark:border-yellow-700',
    },
    error: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-300 dark:border-red-700',
    },
    info: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-300 dark:border-blue-700',
    },
    neutral: {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-300 dark:border-gray-600',
    },
}

export function MediaCard<T>({
    title,
    thumbnailUrl,
    url,
    tags,
    metadata,
    primaryActions,
    secondaryActions,
    showProgress,
    progressCurrent = 0,
    progressTotal = 0,
    progressLabel,
    statusBadge,
    error,
    className,
    children,
    hideActions = false,
}: MediaCardProps<T>) {
    const [actionsExpanded, setActionsExpanded] = useState(false)

    const hasSecondaryActions =
        secondaryActions &&
        secondaryActions.filter((a) => a.condition !== false).length > 0

    // Determine if we should show action column
    const showActionColumn =
        !hideActions &&
        (primaryActions.filter((a) => a.condition !== false).length > 0 ||
            hasSecondaryActions)

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(url)
        toast.success('URL copied to clipboard')
    }

    if (error) {
        return (
            <div
                className={cn(
                    'bg-white dark:bg-black rounded-lg border border-black dark:border-white p-6 min-h-[300px]',
                    className,
                )}
            >
                <div className='p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded'>
                    <div className='font-mono text-sm text-red-600 dark:text-red-400'>
                        &quot;ERROR&quot;: &quot;{error}&quot;
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            className={cn(
                'bg-white dark:bg-black rounded-lg border border-black dark:border-white min-h-[240px]',
                className,
            )}
        >
            <div
                className={cn(
                    'min-h-[240px]',
                    showActionColumn &&
                        'grid grid-cols-1 md:grid-cols-[8fr_2fr]',
                )}
            >
                {/* Content Column */}
                <div className='px-4 pt-4 pb-4 space-y-1 max-w-full overflow-hidden'>
                    {/* Title + Status Badge */}
                    <div className='pb-2 border-b border-black dark:border-white'>
                        <div className='flex items-center justify-between gap-2'>
                            <h3
                                className='text-lg font-bold text-black dark:text-white font-mono truncate flex-1 min-w-0'
                                title={title || 'Untitled'}
                            >
                                {title || 'Untitled'}
                            </h3>
                            {statusBadge && (
                                <span
                                    className={cn(
                                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0',
                                        badgeVariantClasses[statusBadge.variant]
                                            .bg,
                                        badgeVariantClasses[statusBadge.variant]
                                            .text,
                                        badgeVariantClasses[statusBadge.variant]
                                            .border,
                                    )}
                                >
                                    {statusBadge.text}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Thumbnail + Content Row */}
                    <div className='flex flex-col sm:flex-row gap-4'>
                        {/* Thumbnail */}
                        <div className='w-full sm:w-[304px] aspect-video sm:aspect-auto sm:flex-shrink-0 sm:h-[171px] pt-4'>
                            <ThumbnailDisplay
                                src={thumbnailUrl}
                                alt={title || 'Thumbnail'}
                            />
                        </div>

                        {/* Content */}
                        <div className='flex-1 min-w-0 w-full sm:w-auto sm:flex sm:items-center'>
                            <div className='rounded-lg p-4 font-mono w-full'>
                                <div className='text-sm'>
                                    {'{'}
                                    <div className='ml-4 space-y-1'>
                                        {metadata.map((item, index) => (
                                            <div key={item.key}>
                                                <span className='text-purple-600 dark:text-purple-400'>
                                                    &quot;{item.key}&quot;
                                                </span>
                                                :{' '}
                                                <span
                                                    className={
                                                        colorClasses[
                                                            item.color ||
                                                                'green'
                                                        ]
                                                    }
                                                >
                                                    {typeof item.value ===
                                                    'string'
                                                        ? `"${item.value}"`
                                                        : item.value}
                                                </span>
                                                {index < metadata.length - 1 &&
                                                    ','}
                                            </div>
                                        ))}
                                        {tags && tags.length > 0 && (
                                            <div>
                                                <span className='text-purple-600 dark:text-purple-400'>
                                                    &quot;TAGS&quot;
                                                </span>
                                                :{' '}
                                                <span className='text-yellow-600 dark:text-yellow-400'>
                                                    [
                                                    {tags
                                                        .map(
                                                            (tag) =>
                                                                `"${tag.name}"`,
                                                        )
                                                        .join(', ')}
                                                    ]
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {'}'}
                                </div>

                                {/* Progress bar */}
                                {showProgress && progressTotal > 0 && (
                                    <div className='mt-4'>
                                        <ProgressBar
                                            current={progressCurrent}
                                            total={progressTotal}
                                            showLabel={true}
                                        />
                                    </div>
                                )}

                                {/* Custom children content */}
                                {children}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Column - Only show if we have actions */}
                {showActionColumn && (
                    <div className='px-4 py-4 flex flex-col md:border-l border-black dark:border-white justify-center gap-2'>
                        {/* Primary Actions */}
                        {primaryActions
                            .filter((action) => action.condition !== false)
                            .map((action) => (
                                <ActionButton
                                    key={action.id}
                                    label={action.label}
                                    onClick={action.onClick}
                                    href={action.href}
                                    variant={action.variant || 'primary'}
                                    icon={action.icon}
                                    loading={action.loading}
                                />
                            ))}

                        {/* Expand/Collapse Toggle for Secondary Actions */}
                        {hasSecondaryActions && (
                            <>
                                <ActionButton
                                    label={
                                        actionsExpanded ? 'less()' : 'more()'
                                    }
                                    onClick={() =>
                                        setActionsExpanded(!actionsExpanded)
                                    }
                                    variant='ghost'
                                    icon={
                                        <ChevronDown
                                            className={cn(
                                                'w-4 h-4 transition-transform duration-200',
                                                actionsExpanded && 'rotate-180',
                                            )}
                                        />
                                    }
                                />

                                {/* Secondary Actions - Expandable */}
                                {actionsExpanded && (
                                    <div className='flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200'>
                                        {/* Copy URL - always included in secondary */}
                                        <ActionButton
                                            label='copyUrl()'
                                            onClick={handleCopyUrl}
                                            variant='ghost'
                                            icon={<Copy className='w-3 h-3' />}
                                        />

                                        {secondaryActions
                                            .filter(
                                                (action) =>
                                                    action.condition !== false,
                                            )
                                            .map((action) => (
                                                <ActionButton
                                                    key={action.id}
                                                    label={action.label}
                                                    onClick={action.onClick}
                                                    href={action.href}
                                                    variant={
                                                        action.variant ||
                                                        'ghost'
                                                    }
                                                    icon={action.icon}
                                                    loading={action.loading}
                                                />
                                            ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* If no secondary actions but we want copyUrl, show it directly */}
                        {!hasSecondaryActions && (
                            <ActionButton
                                label='copyUrl()'
                                onClick={handleCopyUrl}
                                variant='ghost'
                                icon={<Copy className='w-3 h-3' />}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
