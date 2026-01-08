'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface PlatformUsageChartProps {
    data: Record<string, number>
}

const COLORS = [
    'hsl(var(--primary))',
    'hsl(142 76% 36%)',
    'hsl(221 83% 53%)',
    'hsl(25 95% 53%)',
    'hsl(262 83% 58%)',
    'hsl(0 84% 60%)',
]

export function PlatformUsageChart({ data }: PlatformUsageChartProps) {
    // Transform data for the chart
    const chartData = Object.entries(data).map(([platform, count], index) => ({
        name: platform === 'unknown' ? 'Unknown' : platform.charAt(0).toUpperCase() + platform.slice(1),
        value: count,
        fill: COLORS[index % COLORS.length],
    }))

    if (chartData.length === 0) {
        return (
            <div className="w-full h-64 flex items-center justify-center text-muted-foreground">
                No platform data available
            </div>
        )
    }

    return (
        <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                        }}
                        formatter={(value: number | undefined) => [value || 0, 'Videos']}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}