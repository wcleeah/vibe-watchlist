'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ErrorDisplayProps } from './types'

export function ErrorDisplay({
    error,
    onRetry,
    onToggleManual,
    className,
}: ErrorDisplayProps) {
    return (
        <div
            className={`text-center py-8 space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 ${className}`}
        >
            <div className='text-red-600 dark:text-red-400 text-lg'>
                ⚠️ {error}
            </div>
            <div className='flex gap-2 justify-center'>
                {onRetry && (
                    <Button onClick={onRetry} variant='outline' size='sm'>
                        <RefreshCw className='w-4 h-4 mr-2' />
                        Try Again
                    </Button>
                )}
                {onToggleManual && (
                    <Button
                        onClick={onToggleManual}
                        variant='outline'
                        size='sm'
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
