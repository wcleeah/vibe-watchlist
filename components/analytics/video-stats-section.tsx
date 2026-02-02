'use client'

import { RefreshCw, TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatNumber, formatTimeOnly } from '@/lib/utils/format-utils'

import { PlatformStatsList } from './platform-stats-list'
import { RecentActivityList } from './recent-activity-list'
import { StatCard } from './stat-card'
import { TagStatsList } from './tag-stats-list'
import type { WatchStats } from './types'

interface VideoStatsSectionProps {
    stats: WatchStats | null
    loading: boolean
    lastUpdated: Date | null
    onRefresh: () => void
}

export function VideoStatsSection({
    stats,
    loading,
    lastUpdated,
    onRefresh,
}: VideoStatsSectionProps) {
    if (!stats) {
        return (
            <div className='space-y-6'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <TrendingUp className='w-5 h-5' />
                        <h2 className='text-xl font-semibold'>Live Stats</h2>
                    </div>
                    <Button
                        onClick={onRefresh}
                        disabled={loading}
                        variant='outline'
                        size='sm'
                    >
                        <RefreshCw
                            className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                        />
                        Refresh
                    </Button>
                </div>
                <div className='text-center py-8 text-gray-500'>
                    Loading stats...
                </div>
            </div>
        )
    }

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <TrendingUp className='w-5 h-5' />
                    <h2 className='text-xl font-semibold'>Live Stats</h2>
                </div>
                <div className='flex items-center gap-4'>
                    {lastUpdated && (
                        <span className='text-xs text-gray-500'>
                            Last updated: {formatTimeOnly(lastUpdated)}
                        </span>
                    )}
                    <Button
                        onClick={onRefresh}
                        disabled={loading}
                        variant='outline'
                        size='sm'
                    >
                        <RefreshCw
                            className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                        />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <StatCard value={stats.totalVideos} label='Total Videos' />
                <StatCard value={stats.watchedVideos} label='Watched' />
                <StatCard value={stats.unwatchedVideos} label='To Watch' />
                <StatCard value={`${stats.watchProgress}%`} label='Complete' />
            </div>

            <PlatformStatsList platformStats={stats.platformStats} />
            <TagStatsList tagStats={stats.tagStats} />
            <RecentActivityList activities={stats.recentActivity} />
        </div>
    )
}
