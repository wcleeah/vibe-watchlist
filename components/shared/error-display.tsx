'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorDisplayProps {
    error: string
    onRetry?: () => void
    className?: string
}

export function ErrorDisplay({ error, onRetry, className }: ErrorDisplayProps) {
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
                    {onRetry && (
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={onRetry}
                            className='mt-3 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30'
                        >
                            <RefreshCw className='w-3 h-3 mr-1' />
                            Retry
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
