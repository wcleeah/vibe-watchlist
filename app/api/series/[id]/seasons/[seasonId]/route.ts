import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { seasons, series } from '@/lib/db/schema'
import { ScheduleService } from '@/lib/services/schedule-service'
import {
    formatDateToHKTString,
    getEndOfHKTDay,
    parseToHKT,
} from '@/lib/utils/hkt-date'
import type { ScheduleType, UpdateSeasonRequest } from '@/types/series'

interface RouteParams {
    params: Promise<{ id: string; seasonId: string }>
}

/**
 * Format a raw season row from the database for API response
 */
function formatSeason(s: typeof seasons.$inferSelect) {
    return {
        ...s,
        startDate: formatDateToHKTString(s.startDate),
        endDate: formatDateToHKTString(s.endDate),
        scheduleValue: ScheduleService.parseScheduleValue(
            s.scheduleType as ScheduleType,
            s.scheduleValue,
        ),
    }
}

// PUT /api/series/[id]/seasons/[seasonId] - Update a season
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id, seasonId: seasonIdStr } = await params
        const seriesId = parseInt(id, 10)
        const seasonId = parseInt(seasonIdStr, 10)

        if (Number.isNaN(seriesId) || Number.isNaN(seasonId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid series or season ID' },
                { status: 400 },
            )
        }

        // Verify season exists and belongs to the series
        const existingSeason = await db
            .select()
            .from(seasons)
            .where(
                and(eq(seasons.id, seasonId), eq(seasons.seriesId, seriesId)),
            )
            .limit(1)

        if (existingSeason.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Season not found' },
                { status: 404 },
            )
        }

        const body: UpdateSeasonRequest = await request.json()
        const {
            seasonNumber,
            title,
            url,
            scheduleType,
            scheduleValue,
            startDate,
            endDate,
            isActive,
            totalEpisodes,
            watchedEpisodes,
            isWatched,
            missedPeriods,
            autoAdvanceTotalEpisodes,
        } = body

        // Build update object
        const updateData: Record<string, unknown> = {
            updatedAt: new Date(),
        }

        if (seasonNumber !== undefined) {
            if (seasonNumber < 1) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Season number must be a positive integer',
                    },
                    { status: 400 },
                )
            }
            // Check for duplicate season number (excluding current season)
            const duplicate = await db
                .select({ id: seasons.id })
                .from(seasons)
                .where(
                    and(
                        eq(seasons.seriesId, seriesId),
                        eq(seasons.seasonNumber, seasonNumber),
                    ),
                )
                .limit(1)

            if (duplicate.length > 0 && duplicate[0].id !== seasonId) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Season ${seasonNumber} already exists for this series`,
                    },
                    { status: 409 },
                )
            }
            updateData.seasonNumber = seasonNumber
        }

        if (title !== undefined) updateData.title = title
        if (url !== undefined) updateData.url = url
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
                : new Date(existingSeason[0].startDate)
            updateData.nextEpisodeAt = ScheduleService.calculateNextEpisodeDate(
                scheduleType,
                effectiveScheduleValue,
                baseDate,
            )
        }

        if (startDate !== undefined) {
            updateData.startDate = parseToHKT(startDate)
            // Recalculate next episode if start date changed but schedule didn't
            if (!scheduleType) {
                const effectiveScheduleType = existingSeason[0]
                    .scheduleType as ScheduleType
                const effectiveScheduleValue =
                    ScheduleService.parseScheduleValue(
                        effectiveScheduleType,
                        existingSeason[0].scheduleValue,
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

        // Update season
        await db.update(seasons).set(updateData).where(eq(seasons.id, seasonId))

        // Fetch updated season
        const updatedSeason = await db
            .select()
            .from(seasons)
            .where(eq(seasons.id, seasonId))
            .limit(1)

        if (updatedSeason.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Season not found' },
                { status: 404 },
            )
        }

        return NextResponse.json({
            success: true,
            season: formatSeason(updatedSeason[0]),
        })
    } catch (error) {
        console.error('Error updating season:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update season' },
            { status: 500 },
        )
    }
}

// DELETE /api/series/[id]/seasons/[seasonId] - Delete a season
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id, seasonId: seasonIdStr } = await params
        const seriesId = parseInt(id, 10)
        const seasonId = parseInt(seasonIdStr, 10)

        if (Number.isNaN(seriesId) || Number.isNaN(seasonId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid series or season ID' },
                { status: 400 },
            )
        }

        // Verify season exists and belongs to the series
        const existingSeason = await db
            .select({ id: seasons.id })
            .from(seasons)
            .where(
                and(eq(seasons.id, seasonId), eq(seasons.seriesId, seriesId)),
            )
            .limit(1)

        if (existingSeason.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Season not found' },
                { status: 404 },
            )
        }

        // Delete the season
        await db.delete(seasons).where(eq(seasons.id, seasonId))

        // Check if any seasons remain; if not, set hasSeasons back to false
        const remainingSeasons = await db
            .select({ id: seasons.id })
            .from(seasons)
            .where(eq(seasons.seriesId, seriesId))
            .limit(1)

        if (remainingSeasons.length === 0) {
            await db
                .update(series)
                .set({ hasSeasons: false, updatedAt: new Date() })
                .where(eq(series.id, seriesId))
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting season:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete season' },
            { status: 500 },
        )
    }
}
