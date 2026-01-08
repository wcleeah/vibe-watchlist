import { desc, gte, lte } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dailyAnalytics } from '@/lib/db/schema'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const days = parseInt(searchParams.get('days') || '7', 10)

        // Calculate date range
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        // Get daily analytics data
        const analyticsData = await db
            .select()
            .from(dailyAnalytics)
            .where(
                gte(dailyAnalytics.date, startDate.toISOString().split('T')[0]),
            )
            .orderBy(desc(dailyAnalytics.date))

        // Transform data for charts
        const chartData = analyticsData.map((item) => ({
            date: item.date,
            totalEvents: item.totalEvents,
            eventsByType: item.eventsByType as Record<string, number>,
            platformUsage: item.platformUsage as Record<string, number>,
            errorCount: item.errorCount,
            aiTokenUsage: item.aiTokenUsage,
        }))

        return NextResponse.json({
            success: true,
            data: chartData,
        })
    } catch (error) {
        console.error('Failed to fetch daily analytics:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch analytics data' },
            { status: 500 },
        )
    }
}
