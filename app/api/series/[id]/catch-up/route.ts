import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { series } from '@/lib/db/schema'
import { fetchSeriesWithTags } from '@/lib/db/series-helpers'
import { ScheduleService } from '@/lib/services/schedule-service'
import type { ScheduleType, ScheduleValue } from '@/types/series'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/series/[id]/catch-up - Catch up on a series (reset missed periods)
// This is for recurring series to mark them as caught up
export async function POST(_request: NextRequest, { params }: RouteParams) {
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

        const currentSeries = existingSeries[0]

        // Backlog series (scheduleType: 'none') shouldn't use catch-up
        if (currentSeries.scheduleType === 'none') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Backlog series do not support catch-up. Use update-progress instead.',
                },
                { status: 400 },
            )
        }

        const now = new Date()

        // Calculate next episode date from now
        const scheduleType = currentSeries.scheduleType as ScheduleType
        const scheduleValue = ScheduleService.parseScheduleValue(
            scheduleType,
            currentSeries.scheduleValue,
        )
        const nextEpisodeAt = ScheduleService.calculateNextEpisodeDate(
            scheduleType,
            scheduleValue as ScheduleValue,
            now,
        )

        // Update series: reset missedPeriods, update lastWatchedAt, calculate new nextEpisodeAt
        await db
            .update(series)
            .set({
                missedPeriods: 0,
                lastWatchedAt: now,
                nextEpisodeAt,
                updatedAt: now,
            })
            .where(eq(series.id, seriesId))

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
        console.error('Error catching up on series:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to catch up on series' },
            { status: 500 },
        )
    }
}
