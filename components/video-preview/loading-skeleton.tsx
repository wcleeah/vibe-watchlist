'use client'

import type { LoadingSkeletonProps } from './types'

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
    return (
        <div
            className={`space-y-6 animate-in fade-in-0 duration-300 ${className}`}
        >
            {/* File header skeleton */}
            <div className='flex items-center gap-3'>
                <div className='animate-pulse w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded'></div>
                <div className='animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-32'></div>
            </div>

            {/* Metadata skeleton */}
            <div className='space-y-3'>
                <div className='animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-full'></div>
                <div className='animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5'></div>
                <div className='animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4'></div>
                <div className='animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2'></div>
            </div>

            {/* Thumbnail skeleton */}
            <div className='animate-pulse w-full max-w-xs mx-auto h-32 bg-gray-200 dark:bg-gray-700 rounded'></div>
        </div>
    )
}
