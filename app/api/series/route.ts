import { and, asc, eq, gt, ilike, inArray, or, sql } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import {
    platformConfigs,
    series,
    seriesConfig,
    seriesTags,
    tags,
} from '@/lib/db/schema'
import { aggregateSeasonCounts } from '@/lib/db/series-helpers'
import { ScheduleService } from '@/lib/services/schedule-service'
import {
    formatDateToHKTString,
    getEndOfHKTDay,
    parseToHKT,
} from '@/lib/utils/hkt-date'
import type {
    CreateSeriesRequest,
    ScheduleType,
    ScheduleValue,
} from '@/types/series'

// GET /api/series - Get series with optional filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || 'all' // 'behind', 'caught-up', 'backlog', 'all'
        const platform = searchParams.get('platform')
        const search = searchParams.get('search')
        const isWatchedParam = searchParams.get('isWatched') // 'true' or 'false'
        const sortBy = searchParams.get('sortBy') // 'custom', 'episodesBehind', 'createdAt', 'title'
        const sortOrder = searchParams.get('sortOrder') || 'desc' // 'asc' or 'desc'

        const whereConditions = []

        // Filter by watched tab (isWatched)
        if (isWatchedParam === 'true') {
            whereConditions.push(eq(series.isWatched, true))
        } else if (isWatchedParam === 'false') {
            whereConditions.push(eq(series.isWatched, false))
        }

        // Status filters now need to operate via seriesConfig for single-mode series.
        // For simplicity, we fetch all rows and filter in-memory after flattening,
        // since status depends on config (single) or season aggregation (multi).
        // NOTE: We could push filters to SQL via a subquery later if perf matters.

        // Filter by platform
        if (platform) {
            whereConditions.push(eq(series.platform, platform))
        }

        // Search in title
        if (search?.trim()) {
            const searchPattern = `%${search.trim()}%`
            whereConditions.push(ilike(series.title, searchPattern))
        }

        // Fetch series with LEFT JOIN on seriesConfig
        const rows = await db
            .select({
                series: series,
                config: seriesConfig,
            })
            .from(series)
            .leftJoin(seriesConfig, eq(series.id, seriesConfig.seriesId))
            .where(
                whereConditions.length > 0
                    ? and(...whereConditions)
                    : undefined,
            )
            .orderBy(asc(series.sortOrder))

        // Fetch all tags for the series in one query
        const seriesIds = rows.map((r) => r.series.id)
        const tagsResult =
            seriesIds.length > 0
                ? await db
                      .select({
                          seriesId: seriesTags.seriesId,
                          tagId: tags.id,
                          tagName: tags.name,
                          tagColor: tags.color,
                      })
                      .from(seriesTags)
                      .innerJoin(tags, eq(seriesTags.tagId, tags.id))
                      .where(inArray(seriesTags.seriesId, seriesIds))
                : []

        // Group tags by series
        const tagsBySeries = new Map<
            number,
            Array<{ id: number; name: string; color: string | null }>
        >()
        for (const tag of tagsResult) {
            if (!tagsBySeries.has(tag.seriesId)) {
                tagsBySeries.set(tag.seriesId, [])
            }
            tagsBySeries.get(tag.seriesId)?.push({
                id: tag.tagId,
                name: tag.tagName,
                color: tag.tagColor,
            })
        }

        // Aggregate season episode counts for multi-season series
        const multiSeasonIds = rows
            .filter((r) => r.series.hasSeasons)
            .map((r) => r.series.id)
        const seasonAggregates = await aggregateSeasonCounts(multiSeasonIds)

        // Build flattened series list
        const seriesWithTags = rows.map((row) => {
            const s = row.series
            const config = row.config
            const agg = s.hasSeasons ? seasonAggregates.get(s.id) : undefined

            // Config fields come from series_config (single) or defaults + aggregation (multi)
            const scheduleType = config
                ? (config.scheduleType as ScheduleType)
                : ('none' as ScheduleType)
            const scheduleValue = config
                ? ScheduleService.parseScheduleValue(
                      config.scheduleType as ScheduleType,
                      config.scheduleValue,
                  )
                : ({} as ScheduleValue)
            const startDate = config
                ? formatDateToHKTString(config.startDate)
                : new Date().toISOString()
            const endDate = config
                ? formatDateToHKTString(config.endDate)
                : null
            const lastWatchedAt = config?.lastWatchedAt ?? null
            const nextEpisodeAt = config?.nextEpisodeAt ?? new Date(0)
            const isActive = config?.isActive ?? true
            const episodesAired =
                agg?.episodesAired ?? config?.episodesAired ?? 0
            const episodesRemaining =
                agg?.episodesRemaining ?? config?.episodesRemaining ?? null
            const episodesWatched =
                agg?.episodesWatched ?? config?.episodesWatched ?? 0

            return {
                ...s,
                scheduleType,
                scheduleValue,
                startDate,
                endDate,
                lastWatchedAt,
                nextEpisodeAt,
                isActive,
                episodesAired,
                episodesRemaining,
                episodesWatched,
                tags: tagsBySeries.get(s.id) || [],
            }
        })

        // Apply status filter in-memory (since config fields are now joined/aggregated)
        let filtered = seriesWithTags
        if (status === 'behind') {
            filtered = seriesWithTags.filter(
                (s) =>
                    s.isActive &&
                    s.episodesAired > s.episodesWatched &&
                    s.scheduleType !== 'none',
            )
        } else if (status === 'caught-up') {
            filtered = seriesWithTags.filter(
                (s) =>
                    s.isActive &&
                    s.episodesAired <= s.episodesWatched &&
                    s.scheduleType !== 'none',
            )
        } else if (status === 'backlog') {
            filtered = seriesWithTags.filter((s) => s.scheduleType === 'none')
        }

        // Apply sorting
        filtered.sort((a, b) => {
            if (sortBy === 'episodesBehind') {
                const aBehind = a.episodesAired - a.episodesWatched
                const bBehind = b.episodesAired - b.episodesWatched
                const cmp =
                    sortOrder === 'asc' ? aBehind - bBehind : bBehind - aBehind
                if (cmp !== 0) return cmp
                // Secondary: nextEpisodeAt (opposite direction)
                const aNext = a.nextEpisodeAt?.getTime?.() ?? 0
                const bNext = b.nextEpisodeAt?.getTime?.() ?? 0
                return sortOrder === 'asc' ? bNext - aNext : aNext - bNext
            }
            if (sortBy === 'title') {
                const aTitle = a.title ?? ''
                const bTitle = b.title ?? ''
                return sortOrder === 'asc'
                    ? aTitle.localeCompare(bTitle)
                    : bTitle.localeCompare(aTitle)
            }
            if (sortBy === 'createdAt') {
                const aDate = a.createdAt?.getTime?.() ?? 0
                const bDate = b.createdAt?.getTime?.() ?? 0
                return sortOrder === 'asc' ? aDate - bDate : bDate - aDate
            }
            // Default: custom sort order, then episodes behind desc
            if (a.sortOrder !== b.sortOrder) {
                return a.sortOrder - b.sortOrder
            }
            const aBehind = a.episodesAired - a.episodesWatched
            const bBehind = b.episodesAired - b.episodesWatched
            return bBehind - aBehind
        })

        return NextResponse.json({ success: true, series: filtered })
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
            platform,
            thumbnailUrl,
            scheduleType,
            scheduleValue,
            startDate,
            endDate,
            tagIds,
            episodesAired,
            episodesRemaining,
            episodesWatched,
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
            !['daily', 'weekly', 'custom', 'dates', 'none'].includes(
                scheduleType,
            )
        ) {
            return NextResponse.json(
                { success: false, error: 'Valid schedule type is required' },
                { status: 400 },
            )
        }

        // Schedule value is required for non-backlog series
        if (scheduleType !== 'none' && !scheduleValue) {
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

        // Validate schedule value (use empty object for 'none' type)
        const effectiveScheduleValue =
            scheduleType === 'none' ? {} : scheduleValue
        if (
            !ScheduleService.isValidScheduleValue(
                scheduleType,
                effectiveScheduleValue,
            )
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

        // Parse dates to HKT timezone
        const parsedStartDate = parseToHKT(startDate)
        const parsedEndDate = endDate ? getEndOfHKTDay(endDate) : null

        // Calculate next episode date
        const nextEpisodeAt = ScheduleService.calculateNextEpisodeDate(
            scheduleType,
            effectiveScheduleValue as ScheduleValue,
            parsedStartDate,
        )

        // Insert series (metadata only)
        const newSeries = await db
            .insert(series)
            .values({
                url,
                title: title || null,
                platform,
                thumbnailUrl: thumbnailUrl || null,
                isWatched: false,
            })
            .returning()

        // Insert series_config (schedule + episode data)
        await db.insert(seriesConfig).values({
            seriesId: newSeries[0].id,
            scheduleType,
            scheduleValue: effectiveScheduleValue,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            nextEpisodeAt,
            episodesAired: episodesAired ?? 0,
            episodesRemaining: episodesRemaining ?? null,
            episodesWatched: episodesWatched ?? 0,
            isActive: true,
        })

        const seriesWithTags = {
            ...newSeries[0],
            scheduleType,
            scheduleValue: effectiveScheduleValue as ScheduleValue,
            startDate: formatDateToHKTString(parsedStartDate),
            endDate: formatDateToHKTString(parsedEndDate),
            lastWatchedAt: null,
            nextEpisodeAt,
            isActive: true,
            episodesAired: episodesAired ?? 0,
            episodesRemaining: episodesRemaining ?? null,
            episodesWatched: episodesWatched ?? 0,
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
