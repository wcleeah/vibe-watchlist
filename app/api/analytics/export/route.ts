import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { analyticsEvents } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

// GET /api/analytics/export - Export analytics data as CSV
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const format = searchParams.get('format') || 'csv'
        const timeRange = searchParams.get('timeRange') || '7d'

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

        // Get events
        const events = await db
            .select()
            .from(analyticsEvents)
            .where(sql`${analyticsEvents.createdAt} >= ${startDate}`)
            .orderBy(analyticsEvents.createdAt)

        if (format === 'json') {
            return NextResponse.json({
                events,
                exportedAt: new Date().toISOString(),
                timeRange,
            })
        }

        // Generate CSV
        const csvHeaders = [
            'id',
            'eventType',
            'eventData',
            'userId',
            'sessionId',
            'createdAt',
        ]
        const csvRows = events.map((event) => [
            event.id,
            event.eventType,
            JSON.stringify(event.eventData),
            event.userId || '',
            event.sessionId || '',
            event.createdAt?.toISOString() || '',
        ])

        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n')

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="analytics-export-${timeRange}-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        })
    } catch (error) {
        console.error('Error exporting analytics data:', error)
        return NextResponse.json(
            { error: 'Failed to export analytics data' },
            { status: 500 },
        )
    }
}
