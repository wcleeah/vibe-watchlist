import { and, asc, eq, inArray } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { seasons, series, seriesTags, tags } from '@/lib/db/schema'
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

// Helper function to fetch a single series with its tags
async function fetchSeriesWithTags(seriesId: number) {
    // Fetch series
    const seriesResult = await db
        .select({
            id: series.id,
            url: series.url,
            title: series.title,
            platform: series.platform,
            thumbnailUrl: series.thumbnailUrl,
            scheduleType: series.scheduleType,
            scheduleValue: series.scheduleValue,
            startDate: series.startDate,
            endDate: series.endDate,
            lastWatchedAt: series.lastWatchedAt,
            nextEpisodeAt: series.nextEpisodeAt,
            isActive: series.isActive,
            episodesAired: series.episodesAired,
            episodesRemaining: series.episodesRemaining,
            episodesWatched: series.episodesWatched,
            isWatched: series.isWatched,
            hasSeasons: series.hasSeasons,
            sortOrder: series.sortOrder,
            createdAt: series.createdAt,
            updatedAt: series.updatedAt,
        })
        .from(series)
        .where(eq(series.id, seriesId))
        .limit(1)

    if (seriesResult.length === 0) {
        return null
    }

    const s = seriesResult[0]

    // Fetch tags for this series
    const tagsResult = await db
        .select({
            tagId: tags.id,
            tagName: tags.name,
            tagColor: tags.color,
        })
        .from(seriesTags)
        .innerJoin(tags, eq(seriesTags.tagId, tags.id))
        .where(eq(seriesTags.seriesId, seriesId))

    const parsedTags = tagsResult.map((t) => ({
        id: t.tagId,
        name: t.tagName,
        color: t.tagColor,
    }))

    return {
        ...s,
        startDate: formatDateToHKTString(s.startDate),
        endDate: formatDateToHKTString(s.endDate),
        scheduleValue: ScheduleService.parseScheduleValue(
            s.scheduleType as ScheduleType,
            s.scheduleValue,
        ),
        tags: parsedTags,
    }
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

        // Build update object
        const updateData: Record<string, unknown> = {
            updatedAt: new Date(),
        }

        if (title !== undefined) updateData.title = title
        if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl
        if (isActive !== undefined) updateData.isActive = isActive
        if (episodesAired !== undefined)
            updateData.episodesAired = episodesAired
        if (episodesRemaining !== undefined)
            updateData.episodesRemaining = episodesRemaining
        if (episodesWatched !== undefined)
            updateData.episodesWatched = episodesWatched
        if (isWatched !== undefined) updateData.isWatched = isWatched
        if (hasSeasons !== undefined) updateData.hasSeasons = hasSeasons

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

            updateData.scheduleType = scheduleType
            updateData.scheduleValue = effectiveScheduleValue

            // Recalculate next episode date
            const baseDate = startDate
                ? parseToHKT(startDate)
                : new Date(existingSeries[0].startDate)
            updateData.nextEpisodeAt = ScheduleService.calculateNextEpisodeDate(
                scheduleType,
                effectiveScheduleValue,
                baseDate,
            )
        }

        if (startDate !== undefined) {
            updateData.startDate = parseToHKT(startDate)
            // Only recalculate next episode if start date changed but schedule didn't
            if (!scheduleType) {
                const effectiveScheduleType = existingSeries[0]
                    .scheduleType as ScheduleType
                const effectiveScheduleValue =
                    ScheduleService.parseScheduleValue(
                        effectiveScheduleType,
                        existingSeries[0].scheduleValue,
                    )
                updateData.nextEpisodeAt =
                    ScheduleService.calculateNextEpisodeDate(
                        effectiveScheduleType,
                        effectiveScheduleValue,
                        parseToHKT(startDate),
                    )
            }
        }

        if (endDate !== undefined) {
            updateData.endDate = endDate ? getEndOfHKTDay(endDate) : null
        }

        // Update series
        await db
            .update(series)
            .set(updateData)
            .where(eq(series.id, seriesId))
            .returning()

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

        // Handle bulk seasons sync if provided
        if (seasonsData !== undefined) {
            await syncSeasons(seriesId, seasonsData)
        } else if (hasSeasons === false) {
            // hasSeasons set to false without explicit seasons array — delete all
            await db.delete(seasons).where(eq(seasons.seriesId, seriesId))
        }

        // Fetch updated series with tags
        const seriesWithTags = await fetchSeriesWithTags(seriesId)

        if (!seriesWithTags) {
            return NextResponse.json(
                { success: false, error: 'Series not found' },
                { status: 404 },
            )
        }

        return NextResponse.json({ success: true, series: seriesWithTags })
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

        // Delete series (cascade will handle seriesTags)
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
