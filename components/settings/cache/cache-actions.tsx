'use client'

import { AlertTriangle, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface CacheActionsProps {
    onStatsRefresh: () => void
    onEntriesRefresh: () => void
}

export function CacheActions({
    onStatsRefresh,
    onEntriesRefresh,
}: CacheActionsProps) {
    const [clearingExpired, setClearingExpired] = useState(false)
    const [clearingAll, setClearingAll] = useState(false)

    const handleClearExpired = async () => {
        try {
            setClearingExpired(true)
            const response = await fetch('/api/cache', {
                method: 'DELETE',
            })

            if (response.ok) {
                const data = await response.json()
                toast.success(
                    `Cleared ${data.deletedCount} expired cache entries`,
                )
                onStatsRefresh()
                onEntriesRefresh()
            } else {
                throw new Error('Failed to clear expired cache')
            }
        } catch (error) {
            console.error('Error clearing expired cache:', error)
            toast.error('Failed to clear expired cache entries')
        } finally {
            setClearingExpired(false)
        }
    }

    const handleClearAll = async () => {
        try {
            setClearingAll(true)
            const response = await fetch('/api/cache?all=true', {
                method: 'DELETE',
            })

            if (response.ok) {
                const data = await response.json()
                toast.success(`Cleared all ${data.deletedCount} cache entries`)
                onStatsRefresh()
                onEntriesRefresh()
            } else {
                throw new Error('Failed to clear all cache')
            }
        } catch (error) {
            console.error('Error clearing all cache:', error)
            toast.error('Failed to clear all cache entries')
        } finally {
            setClearingAll(false)
        }
    }

    return (
        <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6'>
            <div className='flex items-center gap-2 mb-4'>
                <AlertTriangle className='w-5 h-5 text-orange-500' />
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                    Cache Management
                </h3>
            </div>

            <p className='text-gray-600 dark:text-gray-400 text-sm mb-6'>
                Manage cached metadata entries. Clearing cache will force fresh
                API calls and may temporarily slow down video processing.
            </p>

            <div className='flex flex-col lg:flex-row gap-4'>
                <div className='flex-1'>
                    <h4 className='text-sm font-medium text-gray-900 dark:text-gray-100 mb-2'>
                        Clear Expired Entries
                    </h4>
                    <p className='text-xs text-gray-600 dark:text-gray-400 mb-3'>
                        Remove cache entries that have passed their expiration
                        date.
                    </p>
                    <Button
                        onClick={handleClearExpired}
                        disabled={clearingExpired}
                        variant='outline'
                        size='sm'
                        className='w-full sm:w-auto'
                    >
                        <Trash2
                            className={`w-4 h-4 mr-2 ${clearingExpired ? 'animate-spin' : ''}`}
                        />
                        {clearingExpired ? 'Clearing...' : 'Clear Expired'}
                    </Button>
                </div>

                <div className='flex-1'>
                    <h4 className='text-sm font-medium text-gray-900 dark:text-gray-100 mb-2'>
                        Clear All Cache
                    </h4>
                    <p className='text-xs text-gray-600 dark:text-gray-400 mb-3'>
                        Remove all cached entries. Use with caution - will
                        impact performance temporarily.
                    </p>
                    <Button
                        onClick={handleClearAll}
                        disabled={clearingAll}
                        variant='destructive'
                        size='sm'
                        className='w-full sm:w-auto'
                    >
                        <Trash2
                            className={`w-4 h-4 mr-2 ${clearingAll ? 'animate-spin' : ''}`}
                        />
                        {clearingAll ? 'Clearing...' : 'Clear All'}
                    </Button>
                </div>
            </div>

            <div className='mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-lg'>
                <div className='flex items-start gap-2'>
                    <AlertTriangle className='w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0' />
                    <div>
                        <h5 className='text-sm font-medium text-yellow-800 dark:text-yellow-200'>
                            Performance Impact
                        </h5>
                        <p className='text-xs text-yellow-700 dark:text-yellow-300 mt-1'>
                            Clearing cache will temporarily slow down video
                            processing as fresh API calls are made. Cache will
                            rebuild automatically as videos are processed.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
