import { type NextRequest, NextResponse } from 'next/server'
import { logEvent } from '@/lib/analytics/events'

// POST /api/events/log - Safe frontend event logging endpoint
export async function POST(request: NextRequest) {
    try {
        const { eventType, payload } = await request.json()

        // Validate required fields
        if (!eventType) {
            return NextResponse.json(
                { error: 'eventType is required' },
                { status: 400 },
            )
        }

        // Log the event using the backend utility
        logEvent(eventType, payload || {})

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error logging frontend event:', error)
        return NextResponse.json(
            { error: 'Failed to log event' },
            { status: 500 },
        )
    }
}
