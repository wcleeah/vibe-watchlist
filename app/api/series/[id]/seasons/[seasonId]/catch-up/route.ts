import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { seasons } from '@/lib/db/schema'
import { ScheduleService } from '@/lib/services/schedule-service'
import { formatDateToHKTString, nowHKT } from '@/lib/utils/hkt-date'
import type { ScheduleType, ScheduleValue } from '@/types/series'

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

// POST /api/series/[id]/seasons/[seasonId]/catch-up - Catch up on a season
export async function POST(_request: NextRequest, { params }: RouteParams) {
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

        const currentSeason = existingSeason[0]

        // Backlog seasons shouldn't use catch-up
        if (currentSeason.scheduleType === 'none') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Backlog seasons do not support catch-up. Use update-progress instead.',
                },
                { status: 400 },
            )
        }

        const now = nowHKT()

        // Calculate next episode date from now
        const scheduleType = currentSeason.scheduleType as ScheduleType
        const scheduleValue = ScheduleService.parseScheduleValue(
            scheduleType,
            currentSeason.scheduleValue,
        )
        const nextEpisodeAt = ScheduleService.calculateNextEpisodeDate(
            scheduleType,
            scheduleValue as ScheduleValue,
            now,
        )

        // Update season: reset missedPeriods, update lastWatchedAt
        await db
            .update(seasons)
            .set({
                missedPeriods: 0,
                lastWatchedAt: now,
                nextEpisodeAt,
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
        console.error('Error catching up on season:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to catch up on season' },
            { status: 500 },
        )
    }
}
