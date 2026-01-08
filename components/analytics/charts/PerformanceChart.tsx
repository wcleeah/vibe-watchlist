'use client'

import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

interface PerformanceChartProps {
    data: Array<{
        date: string
        cacheHitRate: number
        errorRate: number
        aiTokensUsed: number
    }>
}

export function PerformanceChart({ data }: PerformanceChartProps) {
    // Transform data for the chart
    const chartData = data.map((item) => ({
        date: new Date(item.date).toLocaleDateString(),
        'Cache Hit %': Math.round(item.cacheHitRate * 100) / 100,
        'Error %': Math.round(item.errorRate * 100) / 100,
        'AI Tokens': item.aiTokensUsed,
    }))

    return (
        <div className='w-full h-64'>
            <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={chartData}>
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
                    <Bar
                        dataKey='Cache Hit %'
                        fill='hsl(var(--primary))'
                        name='Cache Hit Rate %'
                    />
                    <Bar
                        dataKey='Error %'
                        fill='hsl(0 84% 60%)'
                        name='Error Rate %'
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
