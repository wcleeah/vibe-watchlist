'use client'

import { cn } from '@/lib/utils'
import type { ContentMode } from '@/types/series'

interface ModeToggleProps {
    mode: ContentMode
    onChange: (mode: ContentMode) => void
    disabled?: boolean
    className?: string
}

export function ModeToggle({
    mode,
    onChange,
    disabled = false,
    className,
}: ModeToggleProps) {
    return (
        <div
            className={cn(
                'inline-flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800',
                disabled && 'opacity-50 pointer-events-none',
                className,
            )}
        >
            <button
                type='button'
                onClick={() => onChange('video')}
                disabled={disabled}
                className={cn(
                    'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                    mode === 'video'
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
                )}
            >
                Video
            </button>
            <button
                type='button'
                onClick={() => onChange('series')}
                disabled={disabled}
                className={cn(
                    'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                    mode === 'series'
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
                )}
            >
                Series
            </button>
            <button
                type='button'
                onClick={() => onChange('playlist')}
                disabled={disabled}
                className={cn(
                    'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                    mode === 'playlist'
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
                )}
            >
                Playlist
            </button>
            <button
                type='button'
                onClick={() => onChange('coming-soon')}
                disabled={disabled}
                className={cn(
                    'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                    mode === 'coming-soon'
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
                )}
            >
                Coming Soon
            </button>
        </div>
    )
}
