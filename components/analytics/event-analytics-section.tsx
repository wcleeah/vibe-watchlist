import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, TrendingUp, Activity, Clock, Download } from 'lucide-react'
import { useEffect, useState } from 'react'

interface EventData {
    events: any[]
    total: number
    limit: number
    offset: number
}

interface AggregatedData {
    timeRange: string
    eventCounts: Array<{ eventType: string; count: number }>
    hourlyData: Array<{ hour: string; count: number }>
    recentEvents: any[]
    totalEvents: number
}

interface StatsData {
    totalEvents: number
    processed: number
    unprocessed: number
    processingRate: number
}

export function EventAnalyticsSection() {
    const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>(
        '24h',
    )
    const [eventData, setEventData] = useState<EventData | null>(null)
    const [aggregatedData, setAggregatedData] = useState<AggregatedData | null>(
        null,
    )
    const [stats, setStats] = useState<StatsData | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchEventData = async () => {
        setLoading(true)
        try {
            const [eventsRes, aggregatedRes, statsRes] = await Promise.all([
                fetch(
                    `/api/analytics/events?limit=50&startDate=${getStartDate(timeRange)}`,
                ),
                fetch(`/api/analytics/aggregated?timeRange=${timeRange}`),
                fetch(`/api/analytics/stats?timeRange=${timeRange}`),
            ])

            if (eventsRes.ok) setEventData(await eventsRes.json())
            if (aggregatedRes.ok) setAggregatedData(await aggregatedRes.json())
            if (statsRes.ok) setStats(await statsRes.json())
        } catch (error) {
            console.error('Failed to fetch event analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    // eslint-disable-next-line
    useEffect(() => {
        fetchEventData()
    }, [timeRange])

    const getStartDate = (range: string) => {
        const now = new Date()
        switch (range) {
            case '1h':
                now.setHours(now.getHours() - 1)
                break
            case '24h':
                now.setHours(now.getHours() - 24)
                break
            case '7d':
                now.setDate(now.getDate() - 7)
                break
            case '30d':
                now.setDate(now.getDate() - 30)
                break
        }
        return now.toISOString()
    }

    const exportData = async (format: 'csv' | 'json') => {
        try {
            const response = await fetch(
                `/api/analytics/export?format=${format}&timeRange=${timeRange}`,
            )
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.${format}`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                window.URL.revokeObjectURL(url)
            }
        } catch (error) {
            console.error('Failed to export data:', error)
        }
    }

    if (loading) {
        return (
            <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                    <Activity className='w-5 h-5' />
                    <h2 className='text-xl font-semibold'>Event Analytics</h2>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardContent className='p-6'>
                                <div className='animate-pulse'>
                                    <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                                    <div className='h-8 bg-gray-200 rounded w-1/2'></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <Activity className='w-5 h-5' />
                    <h2 className='text-xl font-semibold'>Event Analytics</h2>
                </div>
                <div className='flex items-center gap-2'>
                    <Button
                        onClick={() => exportData('csv')}
                        variant='outline'
                        size='sm'
                    >
                        <Download className='w-4 h-4 mr-2' />
                        Export CSV
                    </Button>
                    <Button
                        onClick={() => exportData('json')}
                        variant='outline'
                        size='sm'
                    >
                        <Download className='w-4 h-4 mr-2' />
                        Export JSON
                    </Button>
                    <select
                        value={timeRange}
                        onChange={(e) =>
                            setTimeRange(
                                e.target.value as '1h' | '24h' | '7d' | '30d',
                            )
                        }
                        className='px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                        <option value='1h'>Last Hour</option>
                        <option value='24h'>Last 24h</option>
                        <option value='7d'>Last 7 Days</option>
                        <option value='30d'>Last 30 Days</option>
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>
                                Total Events
                            </CardTitle>
                            <TrendingUp className='h-4 w-4 text-muted-foreground' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold'>
                                {stats.totalEvents}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>
                                Processed
                            </CardTitle>
                            <Clock className='h-4 w-4 text-green-500' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold text-green-600'>
                                {stats.processed}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>
                                Pending
                            </CardTitle>
                            <Clock className='h-4 w-4 text-orange-500' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold text-orange-600'>
                                {stats.unprocessed}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>
                                Processing Rate
                            </CardTitle>
                            <Activity className='h-4 w-4 text-blue-500' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold text-blue-600'>
                                {stats.processingRate.toFixed(1)}%
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Event Type Breakdown */}
            {aggregatedData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Event Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-2'>
                            {aggregatedData.eventCounts.map((event) => (
                                <div
                                    key={event.eventType}
                                    className='flex items-center justify-between'
                                >
                                    <span className='text-sm'>
                                        {event.eventType}
                                    </span>
                                    <Badge variant='secondary'>
                                        {event.count}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Events */}
            {eventData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-2 max-h-64 overflow-y-auto'>
                            {eventData.events.slice(0, 20).map((event) => (
                                <div
                                    key={event.id}
                                    className='flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded'
                                >
                                    <div className='flex items-center gap-2'>
                                        <Badge variant='outline'>
                                            {event.eventType}
                                        </Badge>
                                        <span className='text-sm text-gray-600 dark:text-gray-400'>
                                            {new Date(
                                                event.createdAt,
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                    {event.processed && (
                                        <Badge
                                            variant='secondary'
                                            className='text-xs'
                                        >
                                            Processed
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
