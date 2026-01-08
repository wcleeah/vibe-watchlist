import { sql } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { analyticsEvents, videos, videoTags, tags } from '@/lib/db/schema'

// GET /api/analytics/temporal - Time-based data (hot hours, tag tendencies)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // Default to last 7 days if no dates provided
        const now = new Date()
        const defaultStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const start = startDate ? new Date(startDate) : defaultStart
        const end = endDate ? new Date(endDate) : now

        // Build date filter
        const dateFilter = sql`${analyticsEvents.createdAt} >= ${start} AND ${analyticsEvents.createdAt} <= ${end}`

        // 1. Hot Hours - Video activity by hour of day
        const hotHours = await db
            .select({
                hour: sql<number>`extract(hour from ${analyticsEvents.createdAt})`,
                eventType: analyticsEvents.eventType,
                count: sql<number>`count(*)`,
            })
            .from(analyticsEvents)
            .where(sql`${dateFilter} AND eventType IN ('video_added', 'video_watched')`)
            .groupBy(sql`extract(hour from ${analyticsEvents.createdAt})`, analyticsEvents.eventType)
            .orderBy(sql`extract(hour from ${analyticsEvents.createdAt})`)

        // 2. Tag Tendencies - Watch rates by tag
        // Get videos with their tags and watch events
        const tagWatchData = await db
            .select({
                tagId: tags.id,
                tagName: tags.name,
                videosWithTag: sql<number>`count(distinct v.id)`,
                watchedVideos: sql<number>`count(distinct case when ae.eventType = 'video_watched' then v.id end)`,
            })
            .from(tags)
            .innerJoin(videoTags, sql`${tags.id} = ${videoTags.tagId}`)
            .innerJoin(videos, sql`${videoTags.videoId} = ${videos.id}`)
            .leftJoin(analyticsEvents, sql`${videos.id} = (${analyticsEvents.eventData}->>'videoId')::int AND ${analyticsEvents.eventType} = 'video_watched'`)
            .where(sql`${videos.createdAt} >= ${start} AND ${videos.createdAt} <= ${end}`)
            .groupBy(tags.id, tags.name)
            .orderBy(sql`count(distinct v.id) desc`)

        // Calculate watch percentages and tendencies
        const tagTendencies = tagWatchData.map(tag => ({
            tagId: tag.tagId,
            tagName: tag.tagName,
            videosWithTag: tag.videosWithTag,
            watchedVideos: tag.watchedVideos,
            watchPercentage: tag.videosWithTag > 0 ? Math.round((tag.watchedVideos / tag.videosWithTag) * 100) : 0,
        }))

        // 3. Daily trends (for comparison periods)
        const dailyTrends = await db
            .select({
                date: sql<string>`date_trunc('day', ${analyticsEvents.createdAt})`,
                eventType: analyticsEvents.eventType,
                count: sql<number>`count(*)`,
            })
            .from(analyticsEvents)
            .where(sql`${dateFilter} AND eventType IN ('video_added', 'video_watched')`)
            .groupBy(sql`date_trunc('day', ${analyticsEvents.createdAt})`, analyticsEvents.eventType)
            .orderBy(sql`date_trunc('day', ${analyticsEvents.createdAt})`)

        // Group hot hours by hour
        const hourlyActivity = hotHours.reduce((acc, hour) => {
            const hourNum = hour.hour
            if (!acc[hourNum]) {
                acc[hourNum] = { added: 0, watched: 0 }
            }
            if (hour.eventType === 'video_added') {
                acc[hourNum].added = hour.count
            } else if (hour.eventType === 'video_watched') {
                acc[hourNum].watched = hour.count
            }
            return acc
        }, {} as Record<number, { added: number; watched: number }>)

        // Group daily trends
        const dailyActivity = dailyTrends.reduce((acc, day) => {
            const dateKey = day.date
            if (!acc[dateKey]) {
                acc[dateKey] = { added: 0, watched: 0 }
            }
            if (day.eventType === 'video_added') {
                acc[dateKey].added = day.count
            } else if (day.eventType === 'video_watched') {
                acc[dateKey].watched = day.count
            }
            return acc
        }, {} as Record<string, { added: number; watched: number }>)

        return NextResponse.json({
            dateRange: { start, end },
            hotHours: hourlyActivity,
            tagTendencies,
            dailyTrends: dailyActivity,
        })
    } catch (error) {
        console.error('Error fetching temporal analytics:', error)
        return NextResponse.json(
            { error: 'Failed to fetch temporal analytics' },
            { status: 500 },
