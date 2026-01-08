import { sql } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { analyticsEvents, videos } from '@/lib/db/schema'

// GET /api/analytics/metrics - Core metrics with totals/averages/per-platform
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // Default to last 30 days if no dates provided
        const now = new Date()
        const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const start = startDate ? new Date(startDate) : defaultStart
        const end = endDate ? new Date(endDate) : now

        // Build date filter
        const dateFilter = sql`${analyticsEvents.createdAt} >= ${start} AND ${analyticsEvents.createdAt} <= ${end}`

        // 1. Token Usage Metrics
        const tokenMetrics = await db
            .select({
                operation: sql<string>`eventData->>'operation'`,
                platform: sql<string>`eventData->>'platform'`,
                totalTokens: sql<number>`sum((eventData->>'tokens')::int)`,
                inputTokens: sql<number>`sum((eventData->>'inputTokens')::int)`,
                outputTokens: sql<number>`sum((eventData->>'outputTokens')::int)`,
                count: sql<number>`count(*)`,
            })
            .from(analyticsEvents)
            .where(sql`${dateFilter} AND eventType = 'ai_token_used'`)
            .groupBy(sql`eventData->>'operation'`, sql`eventData->>'platform'`)

        // 2. Video Metrics
        const videoMetrics = await db
            .select({
                eventType: analyticsEvents.eventType,
                platform: sql<string>`eventData->>'platform'`,
                count: sql<number>`count(*)`,
            })
            .from(analyticsEvents)
            .where(sql`${dateFilter} AND eventType IN ('video_added', 'video_watched')`)
            .groupBy(analyticsEvents.eventType, sql`eventData->>'platform'`)

        // 3. Suggestion Acceptance Rate
        const suggestionMetrics = await db
            .select({
                totalSuggestions: sql<number>`count(*) filter (where eventType = 'metadata_extract_success')`,
                acceptedSuggestions: sql<number>`count(*) filter (where eventType = 'suggestion_accepted')`,
                platformSuggestions: sql<number>`count(*) filter (where eventType = 'platform_suggestion_accepted')`,
            })
            .from(analyticsEvents)
            .where(sql`${dateFilter} AND eventType IN ('metadata_extract_success', 'suggestion_accepted', 'platform_suggestion_accepted')`)

        // 4. Tag Distribution (from video data, not events)
        const tagDistribution = await db
            .select({
                tagId: sql<number>`unnest(tags)`,
                count: sql<number>`count(*)`,
            })
            .from(videos)
            .where(sql`${videos.createdAt} >= ${start} AND ${videos.createdAt} <= ${end} AND tags IS NOT NULL`)
            .groupBy(sql`unnest(tags)`)
            .orderBy(sql`count(*) desc`)
            .limit(20)

        // Calculate totals and averages
        const totals = {
            totalTokens: tokenMetrics.reduce((sum, m) => sum + (m.totalTokens || 0), 0),
            inputTokens: tokenMetrics.reduce((sum, m) => sum + (m.inputTokens || 0), 0),
            outputTokens: tokenMetrics.reduce((sum, m) => sum + (m.outputTokens || 0), 0),
            videosAdded: videoMetrics.filter(m => m.eventType === 'video_added').reduce((sum, m) => sum + m.count, 0),
            videosWatched: videoMetrics.filter(m => m.eventType === 'video_watched').reduce((sum, m) => sum + m.count, 0),
        }

        const averages = {
            tokensPerVideo: totals.videosAdded > 0 ? Math.round(totals.totalTokens / totals.videosAdded) : 0,
            inputOutputRatio: totals.outputTokens > 0 ? (totals.inputTokens / totals.outputTokens).toFixed(2) : '0',
            acceptanceRate: suggestionMetrics[0]?.totalSuggestions > 0
                ? ((suggestionMetrics[0].acceptedSuggestions / suggestionMetrics[0].totalSuggestions) * 100).toFixed(1)
                : '0',
        }

        // Group by platform
        const platformMetrics = videoMetrics.reduce((acc, metric) => {
            const platform = metric.platform || 'unknown'
            if (!acc[platform]) {
                acc[platform] = { videosAdded: 0, videosWatched: 0 }
            }
            if (metric.eventType === 'video_added') {
                acc[platform].videosAdded = metric.count
            } else if (metric.eventType === 'video_watched') {
                acc[platform].videosWatched = metric.count
            }
            return acc
        }, {} as Record<string, { videosAdded: number; videosWatched: number }>)

        return NextResponse.json({
            dateRange: { start, end },
            totals,
            averages,
            platformMetrics,
            tokenMetrics,
            tagDistribution,
            suggestionMetrics: suggestionMetrics[0] || {},
        })
    } catch (error) {
        console.error('Error fetching analytics metrics:', error)
        return NextResponse.json(
            { error: 'Failed to fetch analytics metrics' },
            { status: 500 },
        )
    }
