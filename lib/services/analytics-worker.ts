import { db } from '@/lib/db'
import { analyticsEvents, dailyAnalytics, performanceMetrics } from '@/lib/db/schema'
import { logEvent } from '@/lib/analytics/events'
import { and, gte, lte, eq } from 'drizzle-orm'

export interface DailyMetrics {
    date: string
    totalEvents: number
    eventsByType: Record<string, number>
    platformUsage: Record<string, number>
    topTags: Array<{ name: string; count: number }>
    errorCount: number
    aiTokenUsage: number
}

export interface PerformanceData {
    date: string
    cacheHitRate: number
    avgResponseTime: number
    errorRate: number
    aiTokensUsed: number
}

export class AnalyticsWorker {
    /**
     * Process all pending events and aggregate them into daily metrics
     */
    async processPendingEvents(): Promise<void> {
        try {
            console.log('🔄 ANALYTICS WORKER: Starting event processing...')

            // Get all unprocessed events
            const pendingEvents = await db
                .select()
                .from(analyticsEvents)
                .where(eq(analyticsEvents.processed, false))

            if (pendingEvents.length === 0) {
                console.log('🔄 ANALYTICS WORKER: No pending events to process')
                return
            }

            console.log(`🔄 ANALYTICS WORKER: Processing ${pendingEvents.length} events`)

            // Group events by date
            const eventsByDate = this.groupEventsByDate(pendingEvents)

            // Process each date
            for (const [dateStr, events] of Object.entries(eventsByDate)) {
                await this.processDailyEvents(dateStr, events)
            }

            // Mark all processed events as processed
            await db
                .update(analyticsEvents)
                .set({ processed: true })
                .where(eq(analyticsEvents.processed, false))

            console.log('✅ ANALYTICS WORKER: Event processing completed successfully')
        } catch (error) {
            console.error('❌ ANALYTICS WORKER: Failed to process events:', error)
            logEvent('error_occurred', {
                operation: 'analytics_processing',
                error: error instanceof Error ? error.message : 'Unknown error',
            })
        }
    }

    /**
     * Process events for a specific date
     */
    private async processDailyEvents(dateStr: string, events: typeof analyticsEvents.$inferSelect[]): Promise<void> {
        // Calculate daily metrics
        const metrics = this.calculateDailyMetrics(events)

        // Calculate performance data
        const performance = await this.calculatePerformanceMetrics(new Date(dateStr))

        // Insert or update daily analytics
        await db
            .insert(dailyAnalytics)
            .values({
                date: dateStr,
                totalEvents: metrics.totalEvents,
                eventsByType: metrics.eventsByType,
                platformUsage: metrics.platformUsage,
                topTags: metrics.topTags,
                errorCount: metrics.errorCount,
                aiTokenUsage: metrics.aiTokenUsage,
            })
            .onConflictDoUpdate({
                target: dailyAnalytics.date,
                set: {
                    totalEvents: metrics.totalEvents,
                    eventsByType: metrics.eventsByType,
                    platformUsage: metrics.platformUsage,
                    topTags: metrics.topTags,
                    errorCount: metrics.errorCount,
                    aiTokenUsage: metrics.aiTokenUsage,
                },
            })

        // Insert or update performance metrics
        await db
            .insert(performanceMetrics)
            .values({
                date: performance.date,
                cacheHitRate: performance.cacheHitRate.toFixed(2),
                avgResponseTime: performance.avgResponseTime,
                errorRate: performance.errorRate.toFixed(2),
                aiTokensUsed: performance.aiTokensUsed,
            })
            .onConflictDoUpdate({
                target: performanceMetrics.date,
                set: {
                    cacheHitRate: performance.cacheHitRate.toFixed(2),
                    avgResponseTime: performance.avgResponseTime,
                    errorRate: performance.errorRate.toFixed(2),
                    aiTokensUsed: performance.aiTokensUsed,
                },
            })
    }

    /**
     * Group events by date (YYYY-MM-DD format)
     */
    private groupEventsByDate(events: typeof analyticsEvents.$inferSelect[]): Record<string, typeof events> {
        const groups: Record<string, typeof events> = {}

        for (const event of events) {
            if (!event.createdAt) continue
            const dateStr = new Date(event.createdAt).toISOString().split('T')[0]
            if (!groups[dateStr]) {
                groups[dateStr] = []
            }
            groups[dateStr].push(event)
        }

        return groups
    }

    /**
     * Calculate daily metrics from events
     */
    private calculateDailyMetrics(events: typeof analyticsEvents.$inferSelect[]): DailyMetrics {
        const eventsByType: Record<string, number> = {}
        const platformUsage: Record<string, number> = {}
        let errorCount = 0
        let aiTokenUsage = 0

        for (const event of events) {
            // Count events by type
            eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1

            // Extract platform usage
            const eventData = event.eventData as any
            if (eventData?.platform) {
                platformUsage[eventData.platform] = (platformUsage[eventData.platform] || 0) + 1
            }

            // Count errors
            if (event.eventType === 'error_occurred') {
                errorCount++
            }

            // Sum AI token usage
            if (event.eventType === 'ai_token_used' && eventData?.tokens) {
                aiTokenUsage += Number(eventData.tokens) || 0
            }
        }

        // Get top tags (simplified - just return empty array for now)
        const topTags: Array<{ name: string; count: number }> = []

        const firstEvent = events[0]
        const dateStr = firstEvent?.createdAt
            ? new Date(firstEvent.createdAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]

        return {
            date: dateStr,
            totalEvents: events.length,
            eventsByType,
            platformUsage,
            topTags,
            errorCount,
            aiTokenUsage,
        }
    }

    /**
     * Calculate performance metrics for a date
     */
    private async calculatePerformanceMetrics(date: Date): Promise<PerformanceData> {
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        // Get events for the day
        const dayEvents = await db
            .select()
            .from(analyticsEvents)
            .where(and(
                gte(analyticsEvents.createdAt, startOfDay),
                lte(analyticsEvents.createdAt, endOfDay)
            ))

        // Calculate cache hit rate
        const cacheEvents = dayEvents.filter(e => e.eventType === 'cache_hit' || e.eventType === 'cache_miss')
        const cacheHits = cacheEvents.filter(e => e.eventType === 'cache_hit').length
        const cacheHitRate = cacheEvents.length > 0 ? (cacheHits / cacheEvents.length) * 100 : 0

        // Calculate error rate
        const errorRate = dayEvents.length > 0 ? (dayEvents.filter(e => e.eventType === 'error_occurred').length / dayEvents.length) * 100 : 0

        // Sum AI tokens used
        const aiTokensUsed = dayEvents
            .filter(e => e.eventType === 'ai_token_used')
            .reduce((sum, e) => sum + ((e.eventData as any)?.tokens || 0), 0)

        return {
            date: date.toISOString().split('T')[0],
            cacheHitRate,
            avgResponseTime: 0, // TODO: Implement response time tracking
            errorRate,
            aiTokensUsed,
        }
    }
}

export const analyticsWorker = new AnalyticsWorker()