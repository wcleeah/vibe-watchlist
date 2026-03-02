import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { seasons } from '@/lib/db/schema'
import { ScheduleService } from '@/lib/services/schedule-service'
import { formatDateToHKTString } from '@/lib/utils/hkt-date'
import type { ScheduleType } from '@/types/series'

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

// POST /api/series/[id]/seasons/[seasonId]/mark-watched - Mark a season as watched
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

        const now = new Date()

        // Mark season as watched
        await db
            .update(seasons)
            .set({
                isWatched: true,
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
        console.error('Error marking season as watched:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to mark season as watched' },
            { status: 500 },
        )
    }
}
