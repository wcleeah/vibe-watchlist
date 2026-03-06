import { and, asc, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { seasons, series } from '@/lib/db/schema'
import { ScheduleService } from '@/lib/services/schedule-service'
import {
    formatDateToHKTString,
    getEndOfHKTDay,
    parseToHKT,
} from '@/lib/utils/hkt-date'
import type {
    CreateSeasonRequest,
    ScheduleType,
    ScheduleValue,
} from '@/types/series'

interface RouteParams {
    params: Promise<{ id: string }>
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

// GET /api/series/[id]/seasons - List all seasons for a series
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

        // Verify series exists and has seasons
        const seriesResult = await db
            .select({ id: series.id, hasSeasons: series.hasSeasons })
            .from(series)
            .where(eq(series.id, seriesId))
            .limit(1)

        if (seriesResult.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Series not found' },
                { status: 404 },
            )
        }

        if (!seriesResult[0].hasSeasons) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'This series does not have seasons enabled',
                },
                { status: 400 },
            )
        }

        const seasonsResult = await db
            .select()
            .from(seasons)
            .where(eq(seasons.seriesId, seriesId))
            .orderBy(asc(seasons.sortOrder), asc(seasons.seasonNumber))

        const formattedSeasons = seasonsResult.map(formatSeason)

        return NextResponse.json({
            success: true,
            seasons: formattedSeasons,
        })
    } catch (error) {
        console.error('Error fetching seasons:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch seasons' },
            { status: 500 },
        )
    }
}

// POST /api/series/[id]/seasons - Add a new season to a series
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const seriesId = parseInt(id, 10)

        if (Number.isNaN(seriesId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid series ID' },
                { status: 400 },
            )
        }

        // Verify series exists
        const seriesResult = await db
            .select({ id: series.id, hasSeasons: series.hasSeasons })
            .from(series)
            .where(eq(series.id, seriesId))
            .limit(1)

        if (seriesResult.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Series not found' },
                { status: 404 },
            )
        }

        const body: CreateSeasonRequest = await request.json()
        const {
            seasonNumber,
            title,
            url,
            scheduleType,
            scheduleValue,
            startDate,
            endDate,
            episodesAired,
            episodesRemaining,
            episodesWatched,
        } = body

        // Validation
        if (!seasonNumber || seasonNumber < 1) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Season number must be a positive integer',
                },
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
                {
                    success: false,
                    error: 'Valid schedule type is required',
                },
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
        const effectiveScheduleValue =
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

        // Check for duplicate season number
        const existingSeason = await db
            .select({ id: seasons.id })
            .from(seasons)
            .where(
                and(
                    eq(seasons.seriesId, seriesId),
                    eq(seasons.seasonNumber, seasonNumber),
                ),
            )
            .limit(1)

        if (existingSeason.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Season ${seasonNumber} already exists for this series`,
                },
                { status: 409 },
            )
        }

        // Parse dates
        const parsedStartDate = parseToHKT(startDate)
        const parsedEndDate = endDate ? getEndOfHKTDay(endDate) : null

        // Calculate next episode date
        const nextEpisodeAt = ScheduleService.calculateNextEpisodeDate(
            scheduleType,
            effectiveScheduleValue as ScheduleValue,
            parsedStartDate,
        )

        // Determine sort order (append after existing seasons)
        const existingSeasons = await db
            .select({ sortOrder: seasons.sortOrder })
            .from(seasons)
            .where(eq(seasons.seriesId, seriesId))
            .orderBy(asc(seasons.sortOrder))

        const maxSortOrder =
            existingSeasons.length > 0
                ? Math.max(...existingSeasons.map((s) => s.sortOrder))
                : -1

        // Insert season
        const newSeason = await db
            .insert(seasons)
            .values({
                seriesId,
                seasonNumber,
                title: title || null,
                url: url || null,
                scheduleType,
                scheduleValue: effectiveScheduleValue,
                startDate: parsedStartDate,
                endDate: parsedEndDate,
                nextEpisodeAt,
                isActive: true,
                episodesAired: episodesAired ?? 0,
                episodesRemaining: episodesRemaining ?? null,
                episodesWatched: episodesWatched ?? 0,
                isWatched: false,
                sortOrder: maxSortOrder + 1,
            })
            .returning()

        // Auto-enable hasSeasons on the series if not already
        if (!seriesResult[0].hasSeasons) {
            await db
                .update(series)
                .set({ hasSeasons: true, updatedAt: new Date() })
                .where(eq(series.id, seriesId))
        }

        const formattedSeason = formatSeason(newSeason[0])

        return NextResponse.json(
            { success: true, season: formattedSeason },
            { status: 201 },
        )
    } catch (error) {
        console.error('Error creating season:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create season' },
            { status: 500 },
        )
    }
}
