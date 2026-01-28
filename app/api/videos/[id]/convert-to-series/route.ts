import { eq, inArray } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { series, seriesTags, tags, videos, videoTags } from '@/lib/db/schema'
import { ScheduleService } from '@/lib/services/schedule-service'
import type { ScheduleType, ScheduleValue } from '@/types/series'

interface ConvertToSeriesRequest {
    scheduleType: ScheduleType
    scheduleValue: ScheduleValue
    startDate: string
    endDate?: string | null
}

// POST /api/videos/[id]/convert-to-series - Convert a video to a series
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params
        const videoId = Number.parseInt(id, 10)

        if (Number.isNaN(videoId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid video ID' },
                { status: 400 },
            )
        }

        const body: ConvertToSeriesRequest = await request.json()
        const { scheduleType, scheduleValue, startDate, endDate } = body

        // Validate schedule type
        if (
            !scheduleType ||
            !['daily', 'weekly', 'custom'].includes(scheduleType)
        ) {
            return NextResponse.json(
                { success: false, error: 'Valid schedule type is required' },
                { status: 400 },
            )
        }

        // Validate schedule value
        if (
            !scheduleValue ||
            !ScheduleService.isValidScheduleValue(scheduleType, scheduleValue)
        ) {
            return NextResponse.json(
                { success: false, error: 'Invalid schedule value' },
                { status: 400 },
            )
        }

        if (!startDate) {
            return NextResponse.json(
                { success: false, error: 'Start date is required' },
                { status: 400 },
            )
        }

        // Fetch the video with its tags
        const videoResult = await db
            .select()
            .from(videos)
            .where(eq(videos.id, videoId))
            .limit(1)

        if (videoResult.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Video not found' },
                { status: 404 },
            )
        }

        const video = videoResult[0]

        // Check if a series with this URL already exists
        const existingSeries = await db
            .select()
            .from(series)
            .where(eq(series.url, video.url))
            .limit(1)

        if (existingSeries.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'A series with this URL already exists',
                },
                { status: 409 },
            )
        }

        // Get video's tags
        const videoTagResults = await db
            .select({ tagId: videoTags.tagId })
            .from(videoTags)
            .where(eq(videoTags.videoId, videoId))

        const tagIds = videoTagResults.map((vt) => vt.tagId)

        // Calculate next episode date
        const parsedStartDate = new Date(startDate)
        const nextEpisodeAt = ScheduleService.calculateNextEpisodeDate(
            scheduleType,
            scheduleValue,
            parsedStartDate,
        )

        // Create the series
        const newSeries = await db
            .insert(series)
            .values({
                url: video.url,
                title: video.title,
                description: null,
                platform: video.platform,
                thumbnailUrl: video.thumbnailUrl,
                scheduleType,
                scheduleValue,
                startDate,
                endDate: endDate || null,
                nextEpisodeAt,
                missedPeriods: 0,
                isActive: true,
            })
            .returning()

        const createdSeries = newSeries[0]

        // Transfer tags to series
        if (tagIds.length > 0) {
            const seriesTagInserts = tagIds.map((tagId) => ({
                seriesId: createdSeries.id,
                tagId,
            }))

            await db.insert(seriesTags).values(seriesTagInserts)
        }

        // Delete the original video (this will cascade delete video_tags)
        await db.delete(videos).where(eq(videos.id, videoId))

        // Fetch tags for response
        let seriesTagsResult: Array<{
            id: number
            name: string
            color: string | null
        }> = []
        if (tagIds.length > 0) {
            seriesTagsResult = await db
                .select({
                    id: tags.id,
                    name: tags.name,
                    color: tags.color,
                })
                .from(tags)
                .where(inArray(tags.id, tagIds))
        }

        return NextResponse.json(
            {
                success: true,
                series: {
                    ...createdSeries,
                    scheduleValue: scheduleValue,
                    tags: seriesTagsResult,
                },
            },
            { status: 201 },
        )
    } catch (error) {
        console.error('Error converting video to series:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to convert video to series' },
            { status: 500 },
        )
    }
}
