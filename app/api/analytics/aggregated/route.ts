import { desc, sql } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { analyticsEvents } from '@/lib/db/schema'

// GET /api/analytics/aggregated - Get aggregated analytics data
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const timeRange = searchParams.get('timeRange') || '24h' // 1h, 24h, 7d, 30d

        // Calculate start date based on time range
        const now = new Date()
        const startDate = new Date()

        switch (timeRange) {
            case '1h':
                startDate.setHours(now.getHours() - 1)
                break
            case '24h':
                startDate.setHours(now.getHours() - 24)
                break
            case '7d':
                startDate.setDate(now.getDate() - 7)
                break
            case '30d':
                startDate.setDate(now.getDate() - 30)
                break
            default:
                startDate.setHours(now.getHours() - 24)
        }

        // Event type counts
        const eventCounts = await db
            .select({
                eventType: analyticsEvents.eventType,
                count: sql<number>`count(*)`,
            })
            .from(analyticsEvents)
            .where(sql`${analyticsEvents.createdAt} >= ${startDate}`)
            .groupBy(analyticsEvents.eventType)
            .orderBy(desc(sql`count(*)`))

        // Hourly breakdown for the time range
        const hourlyData = await db
            .select({
                hour: sql<string>`date_trunc('hour', ${analyticsEvents.createdAt})`,
                count: sql<number>`count(*)`,
            })
            .from(analyticsEvents)
            .where(sql`${analyticsEvents.createdAt} >= ${startDate}`)
            .groupBy(sql`date_trunc('hour', ${analyticsEvents.createdAt})`)
            .orderBy(sql`date_trunc('hour', ${analyticsEvents.createdAt})`)

        // Recent events (last 50)
        const recentEvents = await db
            .select()
            .from(analyticsEvents)
            .orderBy(desc(analyticsEvents.createdAt))
            .limit(50)

        return NextResponse.json({
            timeRange,
            startDate,
            eventCounts,
            hourlyData,
            recentEvents,
            totalEvents: eventCounts.reduce((sum, item) => sum + item.count, 0),
        })
    } catch (error) {
        console.error('Error fetching aggregated analytics:', error)
        return NextResponse.json(
            { error: 'Failed to fetch aggregated analytics' },
            { status: 500 },
        )
    }
}
