'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorDisplayProps {
    error: string
    onRetry?: () => void
    onToggleManual?: () => void
    className?: string
    /**
     * Display variant:
     * - 'inline': Compact inline display with icon (default, used in list pages)
     * - 'centered': Centered display with additional info (used in video preview)
     */
    variant?: 'inline' | 'centered'
}

export function ErrorDisplay({
    error,
    onRetry,
    onToggleManual,
    className,
    variant = 'inline',
}: ErrorDisplayProps) {
    if (variant === 'centered') {
        return (
            <div
                className={cn(
                    'text-center py-8 space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500',
                    className,
                )}
            >
                <div className='text-red-600 dark:text-red-400 text-lg'>
                    <AlertCircle className='w-5 h-5 inline-block mr-2' />
                    {error}
                </div>
                <div className='flex gap-2 justify-center'>
                    {onRetry && (
                        <Button
                            onClick={onRetry}
                            variant='outline'
                            size='sm'
                            type='button'
                        >
                            <RefreshCw className='w-4 h-4 mr-2' />
                            Try Again
                        </Button>
                    )}
                    {onToggleManual && (
                        <Button
                            onClick={onToggleManual}
                            variant='outline'
                            size='sm'
                            type='button'
                        >
                            Enter Manually
                        </Button>
                    )}
                </div>
                <div className='text-sm text-gray-500 bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800'>
                    The video may still be added to your watchlist
                </div>
            </div>
        )
    }

    // Default inline variant
    return (
        <div
            className={cn(
                'p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg',
                className,
            )}
        >
            <div className='flex items-start gap-3'>
                <AlertCircle className='w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5' />
                <div className='flex-1'>
                    <p className='text-red-600 dark:text-red-400 font-mono text-sm'>
                        {error}
                    </p>
                    {(onRetry || onToggleManual) && (
                        <div className='flex gap-2 mt-3'>
                            {onRetry && (
                                <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={onRetry}
                                    type='button'
                                    className='text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30'
                                >
                                    <RefreshCw className='w-3 h-3 mr-1' />
                                    Retry
                                </Button>
                            )}
                            {onToggleManual && (
                                <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={onToggleManual}
                                    type='button'
                                >
                                    Enter Manually
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
