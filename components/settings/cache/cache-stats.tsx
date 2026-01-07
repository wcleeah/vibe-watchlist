'use client'

import { Clock, Database, RefreshCw, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface CacheStats {
    total: number
    active: number
    expired: number
    avgConfidence: number
    estimatedSize: string
    oldestEntry?: string
    newestEntry?: string
    lastUpdated: string
}

export function CacheStats() {
    const [stats, setStats] = useState<CacheStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchStats = useCallback(async () => {
        try {
            setRefreshing(true)
            const response = await fetch('/api/cache/stats')
            if (response.ok) {
                const data = await response.json()
                setStats(data.stats)
            }
        } catch (error) {
            console.error('Failed to fetch cache stats:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    if (loading || !stats) {
        return (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6'
                    >
                        <div className='animate-pulse'>
                            <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2'></div>
                            <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2'></div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString()
    }

    const statCards = [
        {
            title: 'Total Entries',
            value: stats.total.toLocaleString(),
            icon: Database,
            color: 'text-blue-600 dark:text-blue-400',
        },
        {
            title: 'Active Cache',
            value: stats.active.toLocaleString(),
            icon: TrendingUp,
            color: 'text-green-600 dark:text-green-400',
        },
        {
            title: 'Expired Entries',
            value: stats.expired.toLocaleString(),
            icon: Clock,
            color: 'text-orange-600 dark:text-orange-400',
        },
        {
            title: 'Avg Confidence',
            value: `${stats.avgConfidence}%`,
            icon: TrendingUp,
            color: 'text-purple-600 dark:text-purple-400',
        },
    ]

    return (
        <div className='space-y-6'>
            {/* Header with refresh button */}
            <div className='flex items-center justify-between'>
                <div>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                        Cache Statistics
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                        Last updated:{' '}
                        {new Date(stats.lastUpdated).toLocaleTimeString()}
                    </p>
                </div>
                <Button
                    onClick={fetchStats}
                    disabled={refreshing}
                    variant='outline'
                    size='sm'
                >
                    <RefreshCw
                        className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
                    />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                {statCards.map((card) => (
                    <div
                        key={card.title}
                        className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6'
                    >
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                                    {card.title}
                                </p>
                                <p className='text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1'>
                                    {card.value}
                                </p>
                            </div>
                            <card.icon className={`w-8 h-8 ${card.color}`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Additional Details */}
            <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6'>
                <h4 className='text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                    Cache Details
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6 text-sm'>
                    <div>
                        <span className='text-gray-600 dark:text-gray-400'>
                            Estimated Size:
                        </span>
                        <span className='ml-2 font-mono text-gray-900 dark:text-gray-100'>
                            {stats.estimatedSize}
                        </span>
                    </div>
                    <div>
                        <span className='text-gray-600 dark:text-gray-400'>
                            Oldest Entry:
                        </span>
                        <span className='ml-2 font-mono text-gray-900 dark:text-gray-100'>
                            {formatDate(stats.oldestEntry)}
                        </span>
                    </div>
                    <div>
                        <span className='text-gray-600 dark:text-gray-400'>
                            Newest Entry:
                        </span>
                        <span className='ml-2 font-mono text-gray-900 dark:text-gray-100'>
                            {formatDate(stats.newestEntry)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
