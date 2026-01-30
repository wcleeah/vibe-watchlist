import { eq, sql } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { series, seriesTags, tags } from '@/lib/db/schema'
import { ScheduleService } from '@/lib/services/schedule-service'
import type { ScheduleType, UpdateProgressRequest } from '@/types/series'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/series/[id]/update-progress - Update episode progress
// Can either set absolute watchedEpisodes or increment by a value
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

        const body: UpdateProgressRequest = await request.json()
        const { watchedEpisodes, increment } = body

        // Validate input
        if (watchedEpisodes === undefined && increment === undefined) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Either watchedEpisodes or increment must be provided',
                },
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
        const now = new Date()

        // Calculate new watched episodes count
        let newWatchedEpisodes: number
        if (watchedEpisodes !== undefined) {
            newWatchedEpisodes = Math.max(0, watchedEpisodes)
        } else {
            newWatchedEpisodes = Math.max(
                0,
                currentSeries.watchedEpisodes + (increment ?? 0),
            )
        }

        // Don't exceed total episodes if set
        if (
            currentSeries.totalEpisodes !== null &&
            newWatchedEpisodes > currentSeries.totalEpisodes
        ) {
            newWatchedEpisodes = currentSeries.totalEpisodes
        }

        // Update series
        await db
            .update(series)
            .set({
                watchedEpisodes: newWatchedEpisodes,
                lastWatchedAt: now,
                updatedAt: now,
            })
            .where(eq(series.id, seriesId))

        // Fetch updated series with tags
        const result = await db
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
                tags: sql`COALESCE(json_agg(json_build_object('id', ${tags.id}, 'name', ${tags.name}, 'color', ${tags.color})) FILTER (WHERE ${tags.id} IS NOT NULL), '[]'::json)`,
            })
            .from(series)
            .leftJoin(seriesTags, eq(series.id, seriesTags.seriesId))
            .leftJoin(tags, eq(seriesTags.tagId, tags.id))
            .where(eq(series.id, seriesId))
            .groupBy(series.id)

        const s = result[0]
        let parsedTags: Array<Record<string, unknown>> = []

        try {
            if (typeof s.tags === 'string') {
                parsedTags = JSON.parse(s.tags)
            } else if (Array.isArray(s.tags)) {
                parsedTags = s.tags
            }
        } catch {
            parsedTags = []
        }

        const seriesWithTags = {
            ...s,
            scheduleValue: ScheduleService.parseScheduleValue(
                s.scheduleType as ScheduleType,
                s.scheduleValue,
            ),
            tags: parsedTags,
        }

        return NextResponse.json({ success: true, series: seriesWithTags })
    } catch (error) {
        console.error('Error updating series progress:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update progress' },
            { status: 500 },
        )
    }
}
