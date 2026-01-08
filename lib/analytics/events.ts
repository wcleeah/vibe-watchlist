import { db } from '@/lib/db'
import { analyticsEvents } from '@/lib/db/schema'
import type { NewAnalyticsEvent } from '@/lib/db/schema'

export type EventType =
    | 'video_added'
    | 'video_watched'
    | 'video_unwatched'
    | 'video_deleted'
    | 'bulk_operation'
    | 'page_view'
    | 'metadata_extracted'
    | 'search_performed'
    | 'token_used'
    | 'add_video'
    | 'error_occurred'

export interface EventPayload {
    videoId?: number
    url?: string
    platform?: string
    count?: number
    tokens?: number
    accuracy?: number
    page?: string
    [key: string]: any
}

/**
 * Fire-and-forget event logging - non-blocking, no await required
 */
export function logEvent(eventType: EventType, payload: EventPayload = {}) {
    // Fire and forget - don't await, don't block main execution
    db.insert(analyticsEvents)
        .values({
            eventType,
            eventData: payload,
            userId: 'anonymous', // TODO: Add user auth later
            sessionId: 'default', // TODO: Add session tracking
        } as NewAnalyticsEvent)
        .catch((error) => {
            // Silent failure - don't crash the app, but log for debugging
            console.warn('Failed to log analytics event:', error)
        })
}

/**
 * Batch log multiple events at once (still fire-and-forget)
 */
export function logEvents(
    events: Array<{ type: EventType; payload?: EventPayload }>,
) {
    if (events.length === 0) return

    const inserts = events.map(({ type, payload }) => ({
        eventType: type,
        eventData: payload || {},
        userId: 'anonymous',
        sessionId: 'default',
    }))

    db.insert(analyticsEvents)
        .values(inserts as NewAnalyticsEvent[])
        .catch((error) => {
            console.warn('Failed to log batch analytics events:', error)
        })
}
