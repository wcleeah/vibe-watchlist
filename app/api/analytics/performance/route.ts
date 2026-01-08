import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { performanceMetrics } from '@/lib/db/schema'
import { desc, gte } from 'drizzle-orm'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const days = parseInt(searchParams.get('days') || '7', 10)

        // Calculate start date
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        // Get performance metrics data
        const dateFilter = startDate.toISOString().split('T')[0]
        const performanceData = await db
            .select()
            .from(performanceMetrics)
            .where(gte(performanceMetrics.date, dateFilter))
            .orderBy(desc(performanceMetrics.date))

        // Transform data for charts
        const chartData = performanceData.map(item => ({
            date: item.date,
            cacheHitRate: parseFloat(item.cacheHitRate || '0'),
            avgResponseTime: item.avgResponseTime || 0,
            errorRate: parseFloat(item.errorRate || '0'),
            aiTokensUsed: item.aiTokensUsed || 0,
        }))

        return NextResponse.json({
            success: true,
            data: chartData,
        })
    } catch (error) {
        console.error('Failed to fetch performance metrics:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch performance data' },
            { status: 500 },
        )
    }
}