'use client'

import { BarChart3, RefreshCw, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { NavigationTabs } from '@/components/navigation-tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface MetricsData {
    dateRange: { start: string; end: string }
    totals: {
        totalTokens: number
        inputTokens: number
        outputTokens: number
        videosAdded: number
        videosWatched: number
    }
    averages: {
        tokensPerVideo: number
        inputOutputRatio: string
        acceptanceRate: string
    }
    platformMetrics: Record<
        string,
        { videosAdded: number; videosWatched: number }
    >
    tokenMetrics: Array<{
        operation: string
        platform: string
        totalTokens: number
        inputTokens: number
        outputTokens: number
        count: number
    }>
    tagDistribution: Array<{ tagId: number; count: number }>
    suggestionMetrics: {
        totalSuggestions: number
        acceptedSuggestions: number
        platformSuggestions: number
    }
}

interface TemporalData {
    dateRange: { start: string; end: string }
    hotHours: Record<number, { added: number; watched: number }>
    tagTendencies: Array<{
        tagId: number
        tagName: string
        videosWithTag: number
        watchedVideos: number
        watchPercentage: number
    }>
    dailyTrends: Record<string, { added: number; watched: number }>
}

export default function AnalyticsPage() {
    const [startDate, setStartDate] = useState(() => {
        const date = new Date()
        date.setDate(date.getDate() - 30)
        return date.toISOString().split('T')[0]
    })

    const [endDate, setEndDate] = useState(
        () => new Date().toISOString().split('T')[0],
    )

    const [metricsData, setMetricsData] = useState<MetricsData | null>(null)
    const [temporalData, setTemporalData] = useState<TemporalData | null>(null)
    const [loading, setLoading] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [metricsRes, temporalRes] = await Promise.all([
                fetch(
                    `/api/analytics/metrics?startDate=${startDate}&endDate=${endDate}`,
                ),
                fetch(
                    `/api/analytics/temporal?startDate=${startDate}&endDate=${endDate}`,
                ),
            ])

            if (metricsRes.ok) {
                const metrics = await metricsRes.json()
                setMetricsData(metrics)
            }

            if (temporalRes.ok) {
                const temporal = await temporalRes.json()
                setTemporalData(temporal)
            }
        } catch (error) {
            console.error('Failed to fetch analytics data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [startDate, endDate])

    // Prepare chart data
    const hotHoursChartData = temporalData
        ? Object.entries(temporalData.hotHours)
              .map(([hour, data]) => ({
                  hour: `${hour}:00`,
                  added: data.added,
                  watched: data.watched,
                  total: data.added + data.watched,
              }))
              .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
        : []

    const tagTendenciesChartData =
        temporalData?.tagTendencies.slice(0, 10).map((tag) => ({
            tag: tag.tagName,
            videos: tag.videosWithTag,
            watched: tag.watchedVideos,
            percentage: tag.watchPercentage,
        })) || []

    const platformChartData = metricsData
        ? Object.entries(metricsData.platformMetrics).map(
              ([platform, data]) => ({
                  platform:
                      platform.charAt(0).toUpperCase() + platform.slice(1),
                  added: data.videosAdded,
                  watched: data.videosWatched,
              }),
          )
        : []

    return (
        <div className='min-h-screen bg-background text-foreground'>
            <NavigationTabs />

            <main className='container mx-auto px-4 pt-32 pb-12 max-w-7xl'>
                <div className='mb-8'>
                    <div className='flex items-center gap-2 mb-4'>
                        <TrendingUp className='w-6 h-6' />
                        <h1 className='text-3xl font-bold'>
                            Analytics Dashboard
                        </h1>
                    </div>

                    {/* Date Range Controls */}
                    <div className='flex flex-col sm:flex-row gap-4 items-end mb-6'>
                        <div className='flex-1'>
                            <label
                                htmlFor='start-date'
                                className='block text-sm font-medium mb-2'
                            >
                                Date Range
                            </label>
                            <div className='flex gap-2'>
                                <div className='flex-1'>
                                    <Input
                                        id='start-date'
                                        type='date'
                                        value={startDate}
                                        onChange={(e) =>
                                            setStartDate(e.target.value)
                                        }
                                        className='w-full'
                                    />
                                </div>
                                <div className='flex-1'>
                                    <Input
                                        id='end-date'
                                        type='date'
                                        value={endDate}
                                        onChange={(e) =>
                                            setEndDate(e.target.value)
                                        }
                                        className='w-full'
                                    />
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={fetchData}
                            disabled={loading}
                            className='mb-0'
                        >
                            <RefreshCw
                                className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                            />
                            Refresh
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className='text-center py-12'>
                        <div className='text-lg text-gray-500'>
                            Loading analytics data...
                        </div>
                    </div>
                ) : (
                    <div className='space-y-8'>
                        {/* Metrics Overview */}
                        {metricsData && (
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                                <div className='p-6 border rounded-lg'>
                                    <div className='text-3xl font-bold text-blue-600'>
                                        {metricsData.totals.totalTokens.toLocaleString()}
                                    </div>
                                    <div className='text-sm text-gray-600'>
                                        Total AI Tokens
                                    </div>
                                    <div className='text-xs text-gray-500 mt-1'>
                                        Input:{' '}
                                        {metricsData.totals.inputTokens.toLocaleString()}{' '}
                                        | Output:{' '}
                                        {metricsData.totals.outputTokens.toLocaleString()}
                                    </div>
                                </div>

                                <div className='p-6 border rounded-lg'>
                                    <div className='text-3xl font-bold text-green-600'>
                                        {metricsData.totals.videosAdded}
                                    </div>
                                    <div className='text-sm text-gray-600'>
                                        Videos Added
                                    </div>
                                    <div className='text-xs text-gray-500 mt-1'>
                                        {metricsData.averages.tokensPerVideo}{' '}
                                        tokens per video
                                    </div>
                                </div>

                                <div className='p-6 border rounded-lg'>
                                    <div className='text-3xl font-bold text-purple-600'>
                                        {metricsData.totals.videosWatched}
                                    </div>
                                    <div className='text-sm text-gray-600'>
                                        Videos Watched
                                    </div>
                                    <div className='text-xs text-gray-500 mt-1'>
                                        Watch rate:{' '}
                                        {Math.round(
                                            (metricsData.totals.videosWatched /
                                                Math.max(
                                                    metricsData.totals
                                                        .videosAdded,
                                                    1,
                                                )) *
                                                100,
                                        )}
                                        %
                                    </div>
                                </div>

                                <div className='p-6 border rounded-lg'>
                                    <div className='text-3xl font-bold text-orange-600'>
                                        {metricsData.averages.acceptanceRate}%
                                    </div>
                                    <div className='text-sm text-gray-600'>
                                        Suggestion Acceptance
                                    </div>
                                    <div className='text-xs text-gray-500 mt-1'>
                                        {
                                            metricsData.suggestionMetrics
                                                .acceptedSuggestions
                                        }{' '}
                                        of{' '}
                                        {
                                            metricsData.suggestionMetrics
                                                .totalSuggestions
                                        }{' '}
                                        accepted
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Charts Row 1 */}
                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                            {/* Hot Hours Chart */}
                            <div className='p-6 border rounded-lg'>
                                <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
                                    <BarChart3 className='w-5 h-5' />
                                    Activity by Hour
                                </h3>
                                <ResponsiveContainer width='100%' height={300}>
                                    <BarChart data={hotHoursChartData}>
                                        <XAxis dataKey='hour' />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar
                                            dataKey='added'
                                            fill='#3b82f6'
                                            name='Videos Added'
                                        />
                                        <Bar
                                            dataKey='watched'
                                            fill='#10b981'
                                            name='Videos Watched'
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Platform Breakdown */}
                            <div className='p-6 border rounded-lg'>
                                <h3 className='text-lg font-semibold mb-4'>
                                    Platform Breakdown
                                </h3>
                                <ResponsiveContainer width='100%' height={300}>
                                    <BarChart data={platformChartData}>
                                        <XAxis dataKey='platform' />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar
                                            dataKey='added'
                                            fill='#6366f1'
                                            name='Added'
                                        />
                                        <Bar
                                            dataKey='watched'
                                            fill='#f59e0b'
                                            name='Watched'
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Charts Row 2 */}
                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                            {/* Tag Tendencies */}
                            <div className='p-6 border rounded-lg'>
                                <h3 className='text-lg font-semibold mb-4'>
                                    Tag Watch Tendencies
                                </h3>
                                <div className='space-y-3 max-h-80 overflow-y-auto'>
                                    {tagTendenciesChartData.map((tag) => (
                                        <div
                                            key={tag.tag}
                                            className='flex items-center justify-between p-3 border rounded'
                                        >
                                            <div className='font-medium'>
                                                #{tag.tag}
                                            </div>
                                            <div className='text-right'>
                                                <div className='text-sm text-gray-600'>
                                                    {tag.watched}/{tag.videos}{' '}
                                                    watched
                                                </div>
                                                <div className='text-lg font-semibold text-green-600'>
                                                    {tag.percentage}%
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Token Usage Breakdown */}
                            <div className='p-6 border rounded-lg'>
                                <h3 className='text-lg font-semibold mb-4'>
                                    Token Usage by Operation
                                </h3>
                                <div className='space-y-3'>
                                    {metricsData?.tokenMetrics.map(
                                        (metric, index) => (
                                            <div
                                                key={index}
                                                className='p-3 border rounded'
                                            >
                                                <div className='font-medium capitalize'>
                                                    {metric.operation.replace(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </div>
                                                <div className='text-sm text-gray-600 mt-1'>
                                                    Total: {metric.totalTokens}{' '}
                                                    | Input:{' '}
                                                    {metric.inputTokens} |
                                                    Output:{' '}
                                                    {metric.outputTokens}
                                                </div>
                                                <div className='text-xs text-gray-500'>
                                                    {metric.count} operations
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
