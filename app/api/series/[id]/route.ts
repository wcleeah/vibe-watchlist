import { and, asc, eq, inArray } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import {
    seasons,
    series,
    seriesConfig,
    seriesTags,
    tags,
} from '@/lib/db/schema'
import { fetchSeriesWithTags } from '@/lib/db/series-helpers'
import { ScheduleService } from '@/lib/services/schedule-service'
import {
    formatDateToHKTString,
    getEndOfHKTDay,
    parseToHKT,
} from '@/lib/utils/hkt-date'
import type {
    BulkSeasonData,
    ScheduleType,
    ScheduleValue,
    UpdateSeriesRequest,
} from '@/types/series'

interface RouteParams {
    params: Promise<{ id: string }>
}

/**
 * Sync seasons for a series: create new, update existing, delete removed.
 * Diffs the incoming array against DB rows by id.
 */
async function syncSeasons(seriesId: number, seasonsData: BulkSeasonData[]) {
    // Fetch existing seasons from DB
    const existing = await db
        .select()
        .from(seasons)
        .where(eq(seasons.seriesId, seriesId))

    const existingIds = existing.map((s) => s.id)
    const incomingIds = seasonsData
        .filter((s) => s.id !== undefined)
        .map((s) => s.id as number)

    // Delete seasons that are in DB but not in incoming array
    const toDelete = existingIds.filter((id) => !incomingIds.includes(id))
    if (toDelete.length > 0) {
        await db
            .delete(seasons)
            .where(
                and(
                    eq(seasons.seriesId, seriesId),
                    inArray(seasons.id, toDelete),
                ),
            )
    }

    // Process each incoming season
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

        if (s.id && existingIds.includes(s.id)) {
            // Update existing season
            await db
                .update(seasons)
                .set({
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
                    sortOrder: i,
                    updatedAt: new Date(),
                })
                .where(eq(seasons.id, s.id))
        } else {
            // Create new season
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
}

// GET /api/series/[id] - Get a single series
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const seriesId = parseInt(id, 10)

        if (Number.isNaN(seriesId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid series ID' },
                { status: 400 },
            )
        }

        const seriesWithTags = await fetchSeriesWithTags(seriesId)

        if (!seriesWithTags) {
            return NextResponse.json(
                { success: false, error: 'Series not found' },
                { status: 404 },
            )
        }

        // If series has seasons, include them in the response
        if (seriesWithTags.hasSeasons) {
            const seasonsResult = await db
                .select()
                .from(seasons)
                .where(eq(seasons.seriesId, seriesId))
                .orderBy(asc(seasons.sortOrder), asc(seasons.seasonNumber))

            const formattedSeasons = seasonsResult.map((s) => ({
                ...s,
                startDate: formatDateToHKTString(s.startDate),
                endDate: formatDateToHKTString(s.endDate),
                scheduleValue: ScheduleService.parseScheduleValue(
                    s.scheduleType as ScheduleType,
                    s.scheduleValue,
                ),
            }))

            return NextResponse.json({
                success: true,
                series: { ...seriesWithTags, seasons: formattedSeasons },
            })
        }

        return NextResponse.json({ success: true, series: seriesWithTags })
    } catch (error) {
        console.error('Error fetching series:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch series' },
            { status: 500 },
        )
    }
}

// PUT /api/series/[id] - Update a series
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const seriesId = parseInt(id, 10)

        if (Number.isNaN(seriesId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid series ID' },
                { status: 400 },
            )
        }

        const body: UpdateSeriesRequest = await request.json()
        const {
            title,
            thumbnailUrl,
            scheduleType,
            scheduleValue,
            startDate,
            endDate,
            tagIds,
            isActive,
            episodesAired,
            episodesRemaining,
            episodesWatched,
            isWatched,
            hasSeasons,
            seasons: seasonsData,
        } = body

        // Check if series exists
        const existingSeries = await db
            .select()
            .from(series)
            .where(eq(series.id, seriesId))
            .limit(1)

        if (existingSeries.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Series not found' },
                { status: 404 },
            )
        }

        // Fetch existing series_config (may not exist for multi-season series)
        const existingConfigRows = await db
            .select()
            .from(seriesConfig)
            .where(eq(seriesConfig.seriesId, seriesId))
            .limit(1)
        const existingConfig =
            existingConfigRows.length > 0 ? existingConfigRows[0] : null

        // ── Detect mode switch ──
        const wasSeasonsMode = existingSeries[0].hasSeasons
        const willBeSeasonsMode =
            hasSeasons !== undefined ? hasSeasons : wasSeasonsMode
        const switchingToSeasons = !wasSeasonsMode && willBeSeasonsMode
        const switchingToSingle = wasSeasonsMode && !willBeSeasonsMode

        // ── Build series metadata update ──
        const seriesUpdateData: Record<string, unknown> = {
            updatedAt: new Date(),
        }
        if (title !== undefined) seriesUpdateData.title = title
        if (thumbnailUrl !== undefined)
            seriesUpdateData.thumbnailUrl = thumbnailUrl
        if (isWatched !== undefined) seriesUpdateData.isWatched = isWatched
        if (hasSeasons !== undefined) seriesUpdateData.hasSeasons = hasSeasons

        // Update series metadata
        await db
            .update(series)
            .set(seriesUpdateData)
            .where(eq(series.id, seriesId))

        // ── Mode switch: Single → Seasons ──
        // Hard delete the series_config row; season rows will be created by syncSeasons below
        if (switchingToSeasons && existingConfig) {
            await db
                .delete(seriesConfig)
                .where(eq(seriesConfig.seriesId, seriesId))
        }

        // ── Mode switch: Seasons → Single ──
        // Hard delete all season rows; series_config will be created by the upsert below
        if (switchingToSingle) {
            await db.delete(seasons).where(eq(seasons.seriesId, seriesId))
        }

        // ── Build seriesConfig update (for single-mode series) ──
        // Only update config fields if the series will be in single mode
        const willHaveConfig = !willBeSeasonsMode

        if (willHaveConfig) {
            // Re-check config existence after potential mode-switch deletion
            const currentConfig = switchingToSingle ? null : existingConfig

            const configUpdateData: Record<string, unknown> = {
                updatedAt: new Date(),
            }

            if (isActive !== undefined) configUpdateData.isActive = isActive
            if (episodesAired !== undefined)
                configUpdateData.episodesAired = episodesAired
            if (episodesRemaining !== undefined)
                configUpdateData.episodesRemaining = episodesRemaining
            if (episodesWatched !== undefined)
                configUpdateData.episodesWatched = episodesWatched

            // Handle schedule changes
            if (scheduleType) {
                const effectiveScheduleValue =
                    scheduleValue ??
                    ScheduleService.getDefaultScheduleValue(scheduleType)

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

                configUpdateData.scheduleType = scheduleType
                configUpdateData.scheduleValue = effectiveScheduleValue

                // Recalculate next episode date
                const baseDate = startDate
                    ? parseToHKT(startDate)
                    : (currentConfig?.startDate ?? new Date())
                configUpdateData.nextEpisodeAt =
                    ScheduleService.calculateNextEpisodeDate(
                        scheduleType,
                        effectiveScheduleValue,
                        baseDate,
                    )
            }

            if (startDate !== undefined) {
                configUpdateData.startDate = parseToHKT(startDate)
                // Only recalculate next episode if start date changed but schedule didn't
                if (!scheduleType && currentConfig) {
                    const effectiveScheduleType =
                        currentConfig.scheduleType as ScheduleType
                    const effectiveScheduleValue =
                        ScheduleService.parseScheduleValue(
                            effectiveScheduleType,
                            currentConfig.scheduleValue,
                        )
                    configUpdateData.nextEpisodeAt =
                        ScheduleService.calculateNextEpisodeDate(
                            effectiveScheduleType,
                            effectiveScheduleValue,
                            parseToHKT(startDate),
                        )
                }
            }

            if (endDate !== undefined) {
                configUpdateData.endDate = endDate
                    ? getEndOfHKTDay(endDate)
                    : null
            }

            // Upsert: update existing config or create new one
            if (currentConfig) {
                await db
                    .update(seriesConfig)
                    .set(configUpdateData)
                    .where(eq(seriesConfig.seriesId, seriesId))
            } else {
                // No config row — create one with defaults + incoming overrides
                await db.insert(seriesConfig).values({
                    seriesId,
                    scheduleType:
                        (configUpdateData.scheduleType as string) ?? 'none',
                    scheduleValue: configUpdateData.scheduleValue ?? {},
                    startDate:
                        (configUpdateData.startDate as Date) ?? new Date(),
                    endDate: (configUpdateData.endDate as Date) ?? null,
                    nextEpisodeAt:
                        (configUpdateData.nextEpisodeAt as Date) ?? new Date(0),
                    isActive: (configUpdateData.isActive as boolean) ?? true,
                    episodesAired:
                        (configUpdateData.episodesAired as number) ?? 0,
                    episodesRemaining:
                        (configUpdateData.episodesRemaining as number | null) ??
                        null,
                    episodesWatched:
                        (configUpdateData.episodesWatched as number) ?? 0,
                })
            }
        }

        // Handle tag updates if provided
        if (tagIds !== undefined) {
            // Delete existing tag associations
            await db.delete(seriesTags).where(eq(seriesTags.seriesId, seriesId))

            // Add new tag associations
            if (tagIds.length > 0) {
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

                const seriesTagInserts = tagResults.map((tag) => ({
                    seriesId,
                    tagId: tag.id,
                }))

                await db.insert(seriesTags).values(seriesTagInserts)
            }
        }

        // Handle bulk seasons sync if provided (only in seasons mode)
        if (willBeSeasonsMode && seasonsData !== undefined) {
            await syncSeasons(seriesId, seasonsData)
        }

        // Fetch updated series with tags
        const updatedSeries = await fetchSeriesWithTags(seriesId)

        if (!updatedSeries) {
            return NextResponse.json(
                { success: false, error: 'Series not found' },
                { status: 404 },
            )
        }

        return NextResponse.json({ success: true, series: updatedSeries })
    } catch (error) {
        console.error('Error updating series:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update series' },
            { status: 500 },
        )
    }
}

// DELETE /api/series/[id] - Delete a series
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const seriesId = parseInt(id, 10)

        if (Number.isNaN(seriesId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid series ID' },
                { status: 400 },
            )
        }

        // Check if series exists
        const existingSeries = await db
            .select()
            .from(series)
            .where(eq(series.id, seriesId))
            .limit(1)

        if (existingSeries.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Series not found' },
                { status: 404 },
            )
        }

        // Delete series (cascade handles seriesConfig, seriesTags, seasons)
        await db.delete(series).where(eq(series.id, seriesId))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting series:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete series' },
            { status: 500 },
        )
    }
}
