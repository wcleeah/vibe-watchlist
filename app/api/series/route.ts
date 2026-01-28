import { and, eq, gt, ilike, inArray, or, sql } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { platformConfigs, series, seriesTags, tags } from '@/lib/db/schema'
import { ScheduleService } from '@/lib/services/schedule-service'
import type {
    CreateSeriesRequest,
    ScheduleType,
    ScheduleValue,
} from '@/types/series'

// GET /api/series - Get series with optional filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || 'behind' // 'behind', 'caught-up', 'all'
        const platform = searchParams.get('platform')
        const search = searchParams.get('search')

        const whereConditions = []

        // Filter by status
        if (status === 'behind') {
            whereConditions.push(
                and(eq(series.isActive, true), gt(series.missedPeriods, 0)),
            )
        } else if (status === 'caught-up') {
            whereConditions.push(
                and(eq(series.isActive, true), eq(series.missedPeriods, 0)),
            )
        }
        // 'all' doesn't add any status filter

        // Filter by platform
        if (platform) {
            whereConditions.push(eq(series.platform, platform))
        }

        // Search in title and description
        if (search?.trim()) {
            const searchPattern = `%${search.trim()}%`
            whereConditions.push(
                or(
                    ilike(series.title, searchPattern),
                    ilike(series.description, searchPattern),
                ),
            )
        }

        const result = await db
            .select({
                id: series.id,
                url: series.url,
                title: series.title,
                description: series.description,
                platform: series.platform,
                thumbnailUrl: series.thumbnailUrl,
                scheduleType: series.scheduleType,
                scheduleValue: series.scheduleValue,
                startDate: series.startDate,
                endDate: series.endDate,
                lastWatchedAt: series.lastWatchedAt,
                missedPeriods: series.missedPeriods,
                nextEpisodeAt: series.nextEpisodeAt,
                isActive: series.isActive,
                createdAt: series.createdAt,
                updatedAt: series.updatedAt,
                tags: sql`COALESCE(json_agg(json_build_object('id', ${tags.id}, 'name', ${tags.name}, 'color', ${tags.color})) FILTER (WHERE ${tags.id} IS NOT NULL), '[]'::json)`,
            })
            .from(series)
            .leftJoin(seriesTags, eq(series.id, seriesTags.seriesId))
            .leftJoin(tags, eq(seriesTags.tagId, tags.id))
            .where(
                whereConditions.length > 0
                    ? and(...whereConditions)
                    : undefined,
            )
            .groupBy(series.id)
            .orderBy(
                sql`${series.missedPeriods} DESC, ${series.nextEpisodeAt} ASC`,
            )

        // Parse the tags and schedule value
        const seriesWithTags = result.map((s) => {
            let parsedTags: Array<Record<string, unknown>> = []

            try {
                if (typeof s.tags === 'string') {
                    parsedTags = JSON.parse(s.tags)
                } else if (Array.isArray(s.tags)) {
                    parsedTags = s.tags
                }
            } catch {
                parsedTags = []
            }

            return {
                ...s,
                scheduleValue: ScheduleService.parseScheduleValue(
                    s.scheduleType as ScheduleType,
                    s.scheduleValue,
                ),
                tags: parsedTags,
            }
        })

        return NextResponse.json({ success: true, series: seriesWithTags })
    } catch (error) {
        console.error('Error fetching series:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch series' },
            { status: 500 },
        )
    }
}

// POST /api/series - Create a new series
export async function POST(request: NextRequest) {
    try {
        const body: CreateSeriesRequest = await request.json()
        const {
            url,
            title,
            description,
            platform,
            thumbnailUrl,
            scheduleType,
            scheduleValue,
            startDate,
            endDate,
            tagIds,
        } = body

        // Validation
        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { success: false, error: 'URL is required' },
                { status: 400 },
            )
        }

        if (!platform) {
            return NextResponse.json(
                { success: false, error: 'Platform is required' },
                { status: 400 },
            )
        }

        if (
            !scheduleType ||
            !['daily', 'weekly', 'custom'].includes(scheduleType)
        ) {
            return NextResponse.json(
                { success: false, error: 'Valid schedule type is required' },
                { status: 400 },
            )
        }

        if (!scheduleValue) {
            return NextResponse.json(
                { success: false, error: 'Schedule value is required' },
                { status: 400 },
            )
        }

        if (!startDate) {
            return NextResponse.json(
                { success: false, error: 'Start date is required' },
                { status: 400 },
            )
        }

        // Validate schedule value
        if (
            !ScheduleService.isValidScheduleValue(scheduleType, scheduleValue)
        ) {
            return NextResponse.json(
                { success: false, error: 'Invalid schedule value' },
                { status: 400 },
            )
        }

        // Verify platform exists
        const platformExists = await db
            .select()
            .from(platformConfigs)
            .where(eq(platformConfigs.platformId, platform))
            .limit(1)

        if (platformExists.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Platform not found' },
                { status: 400 },
            )
        }

        // Check if series with same URL already exists
        const existingSeries = await db
            .select()
            .from(series)
            .where(eq(series.url, url))
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

        // Calculate next episode date
        const parsedStartDate = new Date(startDate)
        const nextEpisodeAt = ScheduleService.calculateNextEpisodeDate(
            scheduleType,
            scheduleValue as ScheduleValue,
            parsedStartDate,
        )

        // Insert series
        const newSeries = await db
            .insert(series)
            .values({
                url,
                title: title || null,
                description: description || null,
                platform,
                thumbnailUrl: thumbnailUrl || null,
                scheduleType,
                scheduleValue,
                startDate,
                endDate: endDate || null,
                nextEpisodeAt,
                missedPeriods: 0,
                isActive: true,
            })
            .returning()

        const seriesWithTags = {
            ...newSeries[0],
            scheduleValue: scheduleValue as ScheduleValue,
            tags: [] as Array<{
                id: number
                name: string
                color: string | null
            }>,
        }

        // Handle tag associations if provided
        if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
            // Validate that all tagIds exist
            const tagResults = await db
                .select()
                .from(tags)
                .where(inArray(tags.id, tagIds))

            if (tagResults.length !== tagIds.length) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'One or more tag IDs do not exist',
                    },
                    { status: 400 },
                )
            }

            // Create series-tag associations
            const seriesTagInserts = tagResults.map((tag) => ({
                seriesId: newSeries[0].id,
                tagId: tag.id,
            }))

            await db.insert(seriesTags).values(seriesTagInserts)

            seriesWithTags.tags = tagResults
        }

        return NextResponse.json(
            { success: true, series: seriesWithTags },
            { status: 201 },
        )
    } catch (error) {
        console.error('Error creating series:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create series' },
            { status: 500 },
        )
    }
}
