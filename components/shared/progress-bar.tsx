'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
    current: number
    total: number
    showLabel?: boolean
    label?: string
    className?: string
}

export function ProgressBar({
    current,
    total,
    showLabel = true,
    label,
    className,
}: ProgressBarProps) {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0

    return (
        <div className={cn('w-full', className)}>
            <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                <div
                    className='bg-green-500 h-2 rounded-full transition-all duration-300'
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                    {label || `${current} / ${total} watched (${percentage}%)`}
                </p>
            )}
        </div>
    )
}
