'use client'

import {
    ArrowDownToLine,
    ArrowUpFromLine,
    Database,
    RefreshCw,
    TrendingUp,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import type { UsageRequest, UsageSummary } from '@/lib/types/usage'
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

const OPERATION_LABELS: Record<string, string> = {
    platform_detection: 'Platform Detection',
    title_suggestion: 'Title Suggestion',
    metadata_quality: 'Metadata Quality',
}

export function AnalyticsDashboard() {
    const [stats, setStats] = useState<WatchStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null)
    const [usageRequests, setUsageRequests] = useState<UsageRequest[]>([])
    const [usageLoading, setUsageLoading] = useState(true)
    const [selectedOperation, setSelectedOperation] = useState<string>('')
    const [selectedRequest, setSelectedRequest] = useState<UsageRequest | null>(
        null,
    )
    const [detailOpen, setDetailOpen] = useState(false)

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
            setIsLoading(false)
        }
    }, [])

    const fetchUsageStats = useCallback(async () => {
        setUsageLoading(true)
        try {
            const params = new URLSearchParams()
            if (selectedOperation) {
                params.set('operation', selectedOperation)
            }
            params.set('limit', '25')

            const response = await fetch(`/api/usage-stats?${params}`)
            if (!response.ok) throw new Error('Failed to fetch usage')
            const data = await response.json()
            setUsageSummary(data.summary)
            setUsageRequests(data.requests)
        } catch (error) {
            console.error('Failed to fetch usage stats:', error)
        } finally {
            setUsageLoading(false)
        }
    }, [selectedOperation])

    useEffect(() => {
        fetchStats()
        fetchUsageStats()
        const interval = setInterval(() => {
            fetchStats()
            fetchUsageStats()
        }, 15000)
        return () => clearInterval(interval)
    }, [fetchStats, fetchUsageStats])

    const formatNumber = (num: number): string => {
        return num.toLocaleString()
    }

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr)
        return date.toLocaleString()
    }

    const handleRowClick = (request: UsageRequest) => {
        setSelectedRequest(request)
        setDetailOpen(true)
    }

    const renderVideoStats = () => {
        if (!stats) {
            return (
                <div className='space-y-6'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                            <TrendingUp className='w-5 h-5' />
                            <h2 className='text-xl font-semibold'>
                                Live Stats
                            </h2>
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
                            {formatNumber(stats.totalVideos)}
                        </div>
                        <div className='text-sm text-gray-600'>
                            Total Videos
                        </div>
                    </div>

                    <div className='p-4 border border-gray-200'>
                        <div className='text-2xl font-bold font-mono'>
                            {formatNumber(stats.watchedVideos)}
                        </div>
                        <div className='text-sm text-gray-600'>Watched</div>
                    </div>

                    <div className='p-4 border border-gray-200'>
                        <div className='text-2xl font-bold font-mono'>
                            {formatNumber(stats.unwatchedVideos)}
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

    const renderUsageStats = () => {
        return (
            <div className='space-y-6'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <Database className='w-5 h-5' />
                        <h2 className='text-xl font-semibold'>API Usage</h2>
                    </div>
                    <Button
                        onClick={fetchUsageStats}
                        disabled={usageLoading}
                        variant='outline'
                        size='sm'
                    >
                        <RefreshCw
                            className={`w-4 h-4 mr-2 ${usageLoading ? 'animate-spin' : ''}`}
                        />
                        Refresh
                    </Button>
                </div>

                {!usageSummary && usageLoading ? (
                    <div className='text-center py-8 text-gray-500'>
                        Loading usage stats...
                    </div>
                ) : usageSummary ? (
                    <>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                            <div className='p-4 border border-gray-200'>
                                <div className='text-2xl font-bold font-mono'>
                                    {formatNumber(usageSummary.totalRequests)}
                                </div>
                                <div className='text-sm text-gray-600'>
                                    Total Requests
                                </div>
                            </div>

                            <div className='p-4 border border-gray-200'>
                                <div className='flex items-center gap-2'>
                                    <ArrowDownToLine className='w-4 h-4 text-blue-500' />
                                    <div className='text-2xl font-bold font-mono'>
                                        {formatNumber(
                                            usageSummary.totalPromptTokens,
                                        )}
                                    </div>
                                </div>
                                <div className='text-sm text-gray-600'>
                                    Prompt Tokens (In)
                                </div>
                            </div>

                            <div className='p-4 border border-gray-200'>
                                <div className='flex items-center gap-2'>
                                    <ArrowUpFromLine className='w-4 h-4 text-green-500' />
                                    <div className='text-2xl font-bold font-mono'>
                                        {formatNumber(
                                            usageSummary.totalCompletionTokens,
                                        )}
                                    </div>
                                </div>
                                <div className='text-sm text-gray-600'>
                                    Completion Tokens (Out)
                                </div>
                            </div>

                            <div className='p-4 border border-gray-200'>
                                <div className='text-2xl font-bold font-mono'>
                                    {formatNumber(usageSummary.totalTokens)}
                                </div>
                                <div className='text-sm text-gray-600'>
                                    Total Tokens
                                </div>
                            </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            {Object.entries(usageSummary.byOperation).map(
                                ([op, data]) => (
                                    <div
                                        key={op}
                                        className='p-4 border border-gray-200'
                                    >
                                        <h4 className='font-semibold font-mono mb-3'>
                                            {OPERATION_LABELS[op] || op}
                                        </h4>
                                        <div className='space-y-1 text-sm'>
                                            <div className='flex justify-between'>
                                                <span className='text-gray-600'>
                                                    Requests:
                                                </span>
                                                <span className='font-mono'>
                                                    {formatNumber(
                                                        data.requests,
                                                    )}
                                                </span>
                                            </div>
                                            <div className='flex justify-between'>
                                                <span className='text-gray-600'>
                                                    Prompt:
                                                </span>
                                                <span className='font-mono'>
                                                    {formatNumber(
                                                        data.promptTokens,
                                                    )}
                                                </span>
                                            </div>
                                            <div className='flex justify-between'>
                                                <span className='text-gray-600'>
                                                    Completion:
                                                </span>
                                                <span className='font-mono'>
                                                    {formatNumber(
                                                        data.completionTokens,
                                                    )}
                                                </span>
                                            </div>
                                            <div className='flex justify-between font-semibold'>
                                                <span className='text-gray-600'>
                                                    Total:
                                                </span>
                                                <span className='font-mono'>
                                                    {formatNumber(
                                                        data.totalTokens,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>

                        <div className='p-4 border border-gray-200'>
                            <div className='flex items-center justify-between mb-4'>
                                <h3 className='text-lg font-semibold font-mono'>
                                    Recent Requests
                                </h3>
                                <select
                                    value={selectedOperation}
                                    onChange={(e) =>
                                        setSelectedOperation(e.target.value)
                                    }
                                    className='px-3 py-1 border border-gray-300 rounded text-sm'
                                >
                                    <option value=''>All Operations</option>
                                    {Object.keys(OPERATION_LABELS).map((op) => (
                                        <option key={op} value={op}>
                                            {OPERATION_LABELS[op]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className='overflow-x-auto'>
                                <table className='w-full text-sm'>
                                    <thead>
                                        <tr className='border-b border-gray-200'>
                                            <th className='text-left py-2 px-3 font-medium text-gray-600'>
                                                Timestamp
                                            </th>
                                            <th className='text-left py-2 px-3 font-medium text-gray-600'>
                                                Operation
                                            </th>
                                            <th className='text-right py-2 px-3 font-medium text-gray-600'>
                                                Duration
                                            </th>
                                            <th className='text-right py-2 px-3 font-medium text-gray-600'>
                                                Prompt
                                            </th>
                                            <th className='text-right py-2 px-3 font-medium text-gray-600'>
                                                Completion
                                            </th>
                                            <th className='text-right py-2 px-3 font-medium text-gray-600'>
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usageRequests.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className='text-center py-8 text-gray-500'
                                                >
                                                    No requests found
                                                </td>
                                            </tr>
                                        ) : (
                                            usageRequests.map((req) => (
                                                <tr
                                                    key={req.id}
                                                    className='border-b border-gray-100 hover:bg-gray-50 cursor-pointer'
                                                    onClick={() =>
                                                        handleRowClick(req)
                                                    }
                                                >
                                                    <td className='py-2 px-3 font-mono text-xs'>
                                                        {formatDate(
                                                            req.createdAt,
                                                        )}
                                                    </td>
                                                    <td className='py-2 px-3 font-mono'>
                                                        {OPERATION_LABELS[
                                                            req.operation
                                                        ] || req.operation}
                                                    </td>
                                                    <td className='py-2 px-3 text-right font-mono text-xs'>
                                                        {req.durationMs
                                                            ? `${(req.durationMs / 1000).toFixed(3)}s`
                                                            : '-'}
                                                    </td>
                                                    <td className='py-2 px-3 text-right font-mono'>
                                                        {formatNumber(
                                                            req.promptTokens,
                                                        )}
                                                    </td>
                                                    <td className='py-2 px-3 text-right font-mono'>
                                                        {formatNumber(
                                                            req.completionTokens,
                                                        )}
                                                    </td>
                                                    <td className='py-2 px-3 text-right font-mono font-semibold'>
                                                        {formatNumber(
                                                            req.totalTokens,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className='text-center py-8 text-gray-500'>
                        No usage data available
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className='space-y-12'>
            {renderVideoStats()}
            {renderUsageStats()}

            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className='!w-[90vw] !max-w-[1200px]'>
                    <DialogHeader>
                        <DialogTitle className='font-mono text-base'>
                            Request Details
                        </DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className='space-y-4'>
                            <div className='grid grid-cols-2 gap-4 text-sm'>
                                <div>
                                    <span className='text-gray-600'>
                                        Operation:
                                    </span>
                                    <span className='ml-2 font-mono'>
                                        {OPERATION_LABELS[
                                            selectedRequest.operation
                                        ] || selectedRequest.operation}
                                    </span>
                                </div>
                                <div>
                                    <span className='text-gray-600'>
                                        Model:
                                    </span>
                                    <span className='ml-2 font-mono text-xs'>
                                        {selectedRequest.model}
                                    </span>
                                </div>
                                <div>
                                    <span className='text-gray-600'>
                                        Timestamp:
                                    </span>
                                    <span className='ml-2 font-mono text-xs'>
                                        {formatDate(selectedRequest.createdAt)}
                                    </span>
                                </div>
                                <div>
                                    <span className='text-gray-600'>
                                        Tokens:
                                    </span>
                                    <span className='ml-2 font-mono text-xs'>
                                        {selectedRequest.promptTokens} /{' '}
                                        {selectedRequest.completionTokens} /{' '}
                                        {selectedRequest.totalTokens}
                                    </span>
                                </div>
                                {selectedRequest.durationMs && (
                                    <div>
                                        <span className='text-gray-600'>
                                            Duration:
                                        </span>
                                        <span className='ml-2 font-mono text-xs'>
                                            {(
                                                selectedRequest.durationMs /
                                                1000
                                            ).toFixed(3)}
                                            s
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className='font-medium text-sm mb-2 flex items-center gap-2'>
                                    <ArrowDownToLine className='w-4 h-4 text-blue-500' />
                                    Prompt
                                </h4>
                                <pre className='bg-gray-100 p-3 rounded text-xs overflow-x-auto font-mono max-h-64 whitespace-pre-wrap break-all'>
                                    {selectedRequest.promptText
                                        ? JSON.stringify(
                                              JSON.parse(
                                                  selectedRequest.promptText,
                                              ),
                                              null,
                                              2,
                                          )
                                        : 'N/A'}
                                </pre>
                            </div>

                            <div>
                                <h4 className='font-medium text-sm mb-2 flex items-center gap-2'>
                                    <ArrowUpFromLine className='w-4 h-4 text-green-500' />
                                    Completion
                                </h4>
                                <pre className='bg-gray-100 p-3 rounded text-xs overflow-x-auto font-mono max-h-64 whitespace-pre-wrap break-all'>
                                    {selectedRequest.completionText
                                        ? JSON.stringify(
                                              JSON.parse(
                                                  selectedRequest.completionText,
                                              ),
                                              null,
                                              2,
                                          )
                                        : 'N/A'}
                                </pre>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
