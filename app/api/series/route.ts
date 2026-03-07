import { and, asc, eq, ilike, inArray } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import {
    platformConfigs,
    seasons,
    series,
    seriesConfig,
    seriesTags,
    tags,
} from '@/lib/db/schema'
import {
    fetchSeriesWithConfigs,
    fetchSeriesWithTags,
} from '@/lib/db/series-helpers'
import { ScheduleService } from '@/lib/services/schedule-service'
import { getEndOfHKTDay, parseToHKT } from '@/lib/utils/hkt-date'
import type {
    BulkSeasonData,
    CreateSeriesRequest,
    ScheduleType,
    ScheduleValue,
} from '@/types/series'

async function syncSeasons(seriesId: number, seasonsData: BulkSeasonData[]) {
    for (let i = 0; i < seasonsData.length; i++) {
        const s = seasonsData[i]
        const parsedStartDate = parseToHKT(s.startDate)
        const parsedEndDate = s.endDate ? getEndOfHKTDay(s.endDate) : null
        const effectiveScheduleValue =
            s.scheduleType === 'none' ? {} : (s.scheduleValue ?? {})
        const nextEpisodeAt = ScheduleService.calculateNextEpisodeDate(
            s.scheduleType,
            effectiveScheduleValue as ScheduleValue,
            parsedStartDate,
        )

        await db.insert(seasons).values({
            seriesId,
            seasonNumber: s.seasonNumber,
            title: s.title || null,
            url: s.url || null,
            scheduleType: s.scheduleType,
            scheduleValue: effectiveScheduleValue,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            nextEpisodeAt,
            isActive: s.isActive ?? true,
            episodesAired: s.episodesAired ?? 0,
            episodesRemaining: s.episodesRemaining ?? null,
            episodesWatched: s.episodesWatched ?? 0,
            isWatched: false,
            sortOrder: i,
        })
    }
}

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

        const flattenedSeriesMap = await fetchSeriesWithConfigs(seriesIds)

        // Build flattened series list
        const seriesWithTags = rows.map((row) => {
            const s = row.series
            const flat = flattenedSeriesMap.get(s.id)

            return {
                ...(flat ?? {
                    ...s,
                    scheduleType: 'none' as ScheduleType,
                    scheduleValue: {} as ScheduleValue,
                    startDate: new Date().toISOString(),
                    endDate: null,
                    lastWatchedAt: null,
                    nextEpisodeAt: new Date(0),
                    isActive: true,
                    episodesAired: 0,
                    episodesRemaining: null,
                    episodesWatched: 0,
                }),
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
            hasSeasons,
            seasons: seasonsData,
        } = body

        const useSeasonsMode = hasSeasons === true

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

        if (useSeasonsMode) {
            if (!Array.isArray(seasonsData) || seasonsData.length === 0) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'At least one season is required in seasons mode',
                    },
                    { status: 400 },
                )
            }

            for (const season of seasonsData) {
                if (!season.seasonNumber || season.seasonNumber < 1) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Each season must have a valid season number',
                        },
                        { status: 400 },
                    )
                }

                if (
                    !season.scheduleType ||
                    !['daily', 'weekly', 'custom', 'dates', 'none'].includes(
                        season.scheduleType,
                    )
                ) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Each season must have a valid schedule type',
                        },
                        { status: 400 },
                    )
                }

                if (season.scheduleType !== 'none' && !season.scheduleValue) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Schedule value is required for non-backlog seasons',
                        },
                        { status: 400 },
                    )
                }

                if (!season.startDate) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Start date is required for each season',
                        },
                        { status: 400 },
                    )
                }

                const effectiveSeasonScheduleValue =
                    season.scheduleType === 'none'
                        ? {}
                        : (season.scheduleValue ?? {})
                if (
                    !ScheduleService.isValidScheduleValue(
                        season.scheduleType,
                        effectiveSeasonScheduleValue,
                    )
                ) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Invalid schedule value in seasons payload',
                        },
                        { status: 400 },
                    )
                }
            }
        } else {
            if (
                !scheduleType ||
                !['daily', 'weekly', 'custom', 'dates', 'none'].includes(
                    scheduleType,
                )
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Valid schedule type is required for single mode',
                    },
                    { status: 400 },
                )
            }

            // Schedule value is required for non-backlog series
            if (scheduleType !== 'none' && !scheduleValue) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Schedule value is required for non-backlog series',
                    },
                    { status: 400 },
                )
            }

            if (!startDate) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Start date is required for single mode',
                    },
                    { status: 400 },
                )
            }

            // Validate schedule value (use empty object for 'none' type)
            const effectiveScheduleValue: ScheduleValue =
                scheduleType === 'none' ? {} : (scheduleValue ?? {})
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

        // Parse dates / schedule for single mode only
        const effectiveScheduleType = scheduleType ?? 'none'
        const effectiveScheduleValue: ScheduleValue =
            effectiveScheduleType === 'none' ? {} : (scheduleValue ?? {})
        const parsedStartDate = startDate ? parseToHKT(startDate) : null
        const parsedEndDate = endDate ? getEndOfHKTDay(endDate) : null
        const nextEpisodeAt = parsedStartDate
            ? ScheduleService.calculateNextEpisodeDate(
                  effectiveScheduleType,
                  effectiveScheduleValue,
                  parsedStartDate,
              )
            : null

        // Insert series (metadata only)
        const newSeries = await db
            .insert(series)
            .values({
                url,
                title: title || null,
                platform,
                thumbnailUrl: thumbnailUrl || null,
                isWatched: false,
                hasSeasons: useSeasonsMode,
            })
            .returning()

        if (useSeasonsMode) {
            await syncSeasons(newSeries[0].id, seasonsData ?? [])
        } else {
            // Insert series_config (schedule + episode data)
            await db.insert(seriesConfig).values({
                seriesId: newSeries[0].id,
                scheduleType: effectiveScheduleType,
                scheduleValue: effectiveScheduleValue,
                startDate: parsedStartDate ?? new Date(),
                endDate: parsedEndDate,
                nextEpisodeAt: nextEpisodeAt ?? new Date(0),
                episodesAired: episodesAired ?? 0,
                episodesRemaining: episodesRemaining ?? null,
                episodesWatched: episodesWatched ?? 0,
                isActive: true,
            })
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
        }

        const createdSeries = await fetchSeriesWithTags(newSeries[0].id)

        if (!createdSeries) {
            return NextResponse.json(
                { success: false, error: 'Failed to load created series' },
                { status: 500 },
            )
        }

        return NextResponse.json(
            { success: true, series: createdSeries },
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
