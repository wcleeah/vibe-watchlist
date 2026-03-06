import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { seasons } from '@/lib/db/schema'
import { ScheduleService } from '@/lib/services/schedule-service'
import { formatDateToHKTString } from '@/lib/utils/hkt-date'
import type { ScheduleType, UpdateProgressRequest } from '@/types/series'

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

// POST /api/series/[id]/seasons/[seasonId]/update-progress - Update season episode progress
export async function POST(request: NextRequest, { params }: RouteParams) {
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

        const body: UpdateProgressRequest = await request.json()
        const { episodesWatched, increment } = body

        // Validate input
        if (episodesWatched === undefined && increment === undefined) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Either episodesWatched or increment must be provided',
                },
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

        const currentSeason = existingSeason[0]
        const now = new Date()

        // Calculate new watched episodes count
        let newWatchedEpisodes: number
        if (episodesWatched !== undefined) {
            newWatchedEpisodes = Math.max(0, episodesWatched)
        } else {
            newWatchedEpisodes = Math.max(
                0,
                currentSeason.episodesWatched + (increment ?? 0),
            )
        }

        // Don't exceed episodes aired
        if (newWatchedEpisodes > currentSeason.episodesAired) {
            newWatchedEpisodes = currentSeason.episodesAired
        }

        // Update season
        await db
            .update(seasons)
            .set({
                episodesWatched: newWatchedEpisodes,
                lastWatchedAt: now,
                updatedAt: now,
            })
            .where(eq(seasons.id, seasonId))

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
        console.error('Error updating season progress:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update season progress' },
            { status: 500 },
        )
    }
}
