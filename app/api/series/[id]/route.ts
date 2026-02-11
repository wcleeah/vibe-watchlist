import { eq, inArray, sql } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { series, seriesTags, tags } from '@/lib/db/schema'
import { ScheduleService } from '@/lib/services/schedule-service'
import {
    formatDateToHKTString,
    getEndOfHKTDay,
    parseToHKT,
} from '@/lib/utils/hkt-date'
import type {
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
            totalEpisodes: series.totalEpisodes,
            watchedEpisodes: series.watchedEpisodes,
            isWatched: series.isWatched,
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
            description,
            thumbnailUrl,
            scheduleType,
            scheduleValue,
            startDate,
            endDate,
            tagIds,
            isActive,
            totalEpisodes,
            watchedEpisodes,
            isWatched,
            missedPeriods,
            autoAdvanceTotalEpisodes,
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
        if (description !== undefined) updateData.description = description
        if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl
        if (isActive !== undefined) updateData.isActive = isActive
        if (totalEpisodes !== undefined)
            updateData.totalEpisodes = totalEpisodes
        if (watchedEpisodes !== undefined)
            updateData.watchedEpisodes = watchedEpisodes
        if (isWatched !== undefined) updateData.isWatched = isWatched
        if (missedPeriods !== undefined)
            updateData.missedPeriods = missedPeriods
        if (autoAdvanceTotalEpisodes !== undefined)
            updateData.autoAdvanceTotalEpisodes = autoAdvanceTotalEpisodes

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
