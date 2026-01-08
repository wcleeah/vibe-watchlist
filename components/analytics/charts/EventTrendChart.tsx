'use client'

import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

interface EventTrendChartProps {
    data: Array<{
        date: string
        totalEvents: number
        add_video?: number
        video_watched?: number
        video_deleted?: number
        error_occurred?: number
    }>
}

export function EventTrendChart({ data }: EventTrendChartProps) {
    // Transform data for the chart
    const chartData = data.map((item) => ({
        date: new Date(item.date).toLocaleDateString(),
        total: item.totalEvents,
        videos:
            (item.add_video || 0) +
            (item.video_watched || 0) +
            (item.video_deleted || 0),
        errors: item.error_occurred || 0,
    }))

    return (
        <div className='w-full h-64'>
            <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis
                        dataKey='date'
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                        }}
                    />
                    <Line
                        type='monotone'
                        dataKey='total'
                        stroke='hsl(var(--primary))'
                        strokeWidth={2}
                        name='Total Events'
                    />
                    <Line
                        type='monotone'
                        dataKey='videos'
                        stroke='hsl(142 76% 36%)'
                        strokeWidth={2}
                        name='Video Events'
                    />
                    <Line
                        type='monotone'
                        dataKey='errors'
                        stroke='hsl(0 84% 60%)'
                        strokeWidth={2}
                        name='Errors'
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
