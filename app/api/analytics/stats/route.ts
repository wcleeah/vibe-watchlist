import { sql } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { analyticsEvents } from '@/lib/db/schema'

// GET /api/analytics/stats - Quick stats for dashboard
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const timeRange = searchParams.get('timeRange') || '24h'

        // Calculate start date
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
        }

        // Get total events in time range
        const totalEvents = await db
            .select({ count: sql<number>`count(*)` })
            .from(analyticsEvents)
            .where(sql`${analyticsEvents.createdAt} >= ${startDate}`)

        return NextResponse.json({
            timeRange,
            totalEvents: totalEvents[0].count,
            processed: totalEvents[0].count, // Assume all are processed for now
            unprocessed: 0,
            processingRate: 100,
        })
    } catch (error) {
        console.error('Error fetching analytics stats:', error)
        return NextResponse.json(
            { error: 'Failed to fetch analytics stats' },
            { status: 500 },
        )
    }
}
