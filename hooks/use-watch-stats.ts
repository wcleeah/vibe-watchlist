'use client'

import { useCallback, useEffect, useState } from 'react'

import type { WatchStats } from '@/components/analytics/types'

interface UseWatchStatsReturn {
    stats: WatchStats | null
    loading: boolean
    lastUpdated: Date | null
    refetch: () => Promise<void>
}

/**
 * Hook for fetching and managing video watch statistics
 */
export function useWatchStats(): UseWatchStatsReturn {
    const [stats, setStats] = useState<WatchStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

    const fetchStats = useCallback(async () => {
        setLoading(true)
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
                    tags?: Array<{ name: string }>
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
                        video.tags.forEach((tag: { name: string }) => {
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
                        })
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
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    return {
        stats,
        loading,
        lastUpdated,
        refetch: fetchStats,
    }
}
