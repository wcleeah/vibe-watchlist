import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { analyticsEvents } from '@/lib/db/schema'
import { desc, sql, and, gte, lte, eq } from 'drizzle-orm'

// GET /api/analytics/events - Get analytics events with optional filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '100', 10)
        const offset = parseInt(searchParams.get('offset') || '0', 10)
        const eventType = searchParams.get('eventType')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // Build where conditions using Drizzle syntax
        const whereConditions = []

        if (eventType) {
            whereConditions.push(eq(analyticsEvents.eventType, eventType))
        }

        if (startDate) {
            whereConditions.push(gte(analyticsEvents.createdAt, new Date(startDate)))
        }

        if (endDate) {
            whereConditions.push(lte(analyticsEvents.createdAt, new Date(endDate)))
        }

        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

        const events = await db
            .select()
            .from(analyticsEvents)
            .where(whereClause)
            .orderBy(desc(analyticsEvents.createdAt))
            .limit(limit)
            .offset(offset)

        // Get total count for pagination
        const totalResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(analyticsEvents)
            .where(whereClause)

        return NextResponse.json({
            events,
            total: totalResult[0].count,
            limit,
            offset,
        })
    } catch (error) {
        console.error('Error fetching analytics events:', error)
        return NextResponse.json(
            { error: 'Failed to fetch analytics events' },
            { status: 500 },
        )
    }
}
