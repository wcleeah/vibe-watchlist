'use client'

import { RefreshCw, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { PLATFORM_NAMES } from '@/lib/utils/platform-utils'

interface WatchStats {
    totalVideos: number
    watchedVideos: number
    unwatchedVideos: number
    watchProgress: number
    platformStats: Record<
        string,
        { total: number; watched: number; percentage: number }
    >
    tagStats: Record<
        string,
        { total: number; watched: number; percentage: number }
    >
    recentActivity: Array<{
        id: number
        title: string
        platform: string
        watchedAt: string
        action: 'added' | 'watched'
    }>
}

export function AnalyticsDashboard() {
    const [stats, setStats] = useState<WatchStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

    const fetchStats = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/videos?limit=1000')
            if (!response.ok) throw new Error('Failed to fetch')
            const videos = await response.json()

            const totalVideos = videos.length
            const watchedVideos = videos.filter(
                (v: { isWatched: boolean }) => v.isWatched,
            ).length
            const unwatchedVideos = totalVideos - watchedVideos
            const watchProgress =
                totalVideos > 0
                    ? Math.round((watchedVideos / totalVideos) * 100)
                    : 0

            const platformStats: Record<
                string,
                { total: number; watched: number; percentage: number }
            > = {}
            const tagStats: Record<
                string,
                { total: number; watched: number; percentage: number }
            > = {}

            videos.forEach(
                (video: {
                    platform: string
                    isWatched: boolean
                    tags?: Array<{ tag: { name: string } }>
                }) => {
                    if (!platformStats[video.platform]) {
                        platformStats[video.platform] = {
                            total: 0,
                            watched: 0,
                            percentage: 0,
                        }
                    }
                    platformStats[video.platform].total++
                    if (video.isWatched) {
                        platformStats[video.platform].watched++
                    }

                    if (video.tags) {
                        video.tags.forEach(
                            ({ tag }: { tag: { name: string } }) => {
                                if (!tagStats[tag.name]) {
                                    tagStats[tag.name] = {
                                        total: 0,
                                        watched: 0,
                                        percentage: 0,
                                    }
                                }
                                tagStats[tag.name].total++
                                if (video.isWatched) {
                                    tagStats[tag.name].watched++
                                }
                            },
                        )
                    }
                },
            )

            Object.values(platformStats).forEach((stat) => {
                stat.percentage =
                    stat.total > 0
                        ? Math.round((stat.watched / stat.total) * 100)
                        : 0
            })
            Object.values(tagStats).forEach((stat) => {
                stat.percentage =
                    stat.total > 0
                        ? Math.round((stat.watched / stat.total) * 100)
                        : 0
            })

            const recentActivity = videos
                .filter((v: { isWatched: boolean }) => v.isWatched)
                .sort(
                    (a: { updatedAt: string }, b: { updatedAt: string }) =>
                        new Date(b.updatedAt).getTime() -
                        new Date(a.updatedAt).getTime(),
                )
                .slice(0, 10)
                .map(
                    (video: {
                        id: number
                        title: string
                        platform: string
                        updatedAt: string
                        isWatched: boolean
                    }) => ({
                        id: video.id,
                        title: video.title || 'Untitled',
                        platform: video.platform,
                        watchedAt: video.updatedAt,
                        action: 'watched' as const,
                    }),
                )

            setStats({
                totalVideos,
                watchedVideos,
                unwatchedVideos,
                watchProgress,
                platformStats,
                tagStats,
                recentActivity,
            })
            setLastUpdated(new Date())
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 15000)
        return () => clearInterval(interval)
    }, [fetchStats])

    if (!stats) {
        return (
            <div className='space-y-6'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <TrendingUp className='w-5 h-5' />
                        <h2 className='text-xl font-semibold'>Live Stats</h2>
                    </div>
                    <Button
                        onClick={fetchStats}
                        disabled={isLoading}
                        variant='outline'
                        size='sm'
                    >
                        <RefreshCw
                            className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
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
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                    <Button
                        onClick={fetchStats}
                        disabled={isLoading}
                        variant='outline'
                        size='sm'
                    >
                        <RefreshCw
                            className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                        />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <div className='p-4 border border-gray-200'>
                    <div className='text-2xl font-bold font-mono'>
                        {stats.totalVideos}
                    </div>
                    <div className='text-sm text-gray-600'>Total Videos</div>
                </div>

                <div className='p-4 border border-gray-200'>
                    <div className='text-2xl font-bold font-mono'>
                        {stats.watchedVideos}
                    </div>
                    <div className='text-sm text-gray-600'>Watched</div>
                </div>

                <div className='p-4 border border-gray-200'>
                    <div className='text-2xl font-bold font-mono'>
                        {stats.unwatchedVideos}
                    </div>
                    <div className='text-sm text-gray-600'>To Watch</div>
                </div>

                <div className='p-4 border border-gray-200'>
                    <div className='text-2xl font-bold font-mono'>
                        {stats.watchProgress}%
                    </div>
                    <div className='text-sm text-gray-600'>Complete</div>
                </div>
            </div>

            <div className='p-4 border border-gray-200'>
                <h3 className='text-lg font-semibold font-mono mb-4'>
                    Platform Statistics
                </h3>
                <div className='space-y-2'>
                    {Object.entries(stats.platformStats).map(
                        ([platform, stat]) => (
                            <div
                                key={platform}
                                className='flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0'
                            >
                                <span className='font-mono text-sm'>
                                    {PLATFORM_NAMES[
                                        platform as keyof typeof PLATFORM_NAMES
                                    ] || platform}
                                </span>
                                <div className='flex items-center gap-4 text-sm font-mono'>
                                    <span>
                                        {stat.watched}/{stat.total}
                                    </span>
                                    <span>{stat.percentage}%</span>
                                </div>
                            </div>
                        ),
                    )}
                </div>
            </div>

            <div className='p-4 border border-gray-200'>
                <h3 className='text-lg font-semibold font-mono mb-4'>
                    Tag Statistics
                </h3>
                <div className='space-y-1'>
                    {Object.entries(stats.tagStats)
                        .sort(([, a], [, b]) => b.total - a.total)
                        .slice(0, 10)
                        .map(([tag, stat]) => (
                            <div
                                key={tag}
                                className='flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0'
                            >
                                <span className='font-mono text-sm'>
                                    #{tag}
                                </span>
                                <div className='flex items-center gap-4 text-sm font-mono'>
                                    <span>
                                        {stat.watched}/{stat.total}
                                    </span>
                                    <span>{stat.percentage}%</span>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            <div className='p-4 border border-gray-200'>
                <h3 className='text-lg font-semibold font-mono mb-4'>
                    Recent Activity
                </h3>
                <div className='space-y-1'>
                    {stats.recentActivity.length === 0 ? (
                        <div className='text-center py-4 text-gray-500 font-mono text-sm'>
                            No recent activity
                        </div>
                    ) : (
                        stats.recentActivity.map((activity) => (
                            <div
                                key={`${activity.id}-${activity.action}`}
                                className='flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0'
                            >
                                <div className='flex-1'>
                                    <div className='font-mono text-sm'>
                                        {activity.title}
                                    </div>
                                    <div className='text-xs text-gray-500 font-mono'>
                                        Watched{' '}
                                        {new Date(
                                            activity.watchedAt,
                                        ).toLocaleDateString()}
                                    </div>
                                </div>
                                <span className='text-sm font-mono'>
                                    {activity.platform}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
