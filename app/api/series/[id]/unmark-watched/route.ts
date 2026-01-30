import { eq, sql } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { series, seriesTags, tags } from '@/lib/db/schema'
import { ScheduleService } from '@/lib/services/schedule-service'
import type { ScheduleType } from '@/types/series'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/series/[id]/unmark-watched - Unmark a series as watched
// Sets isWatched: false to move series back to the Active tab
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

        const now = new Date()

        // Unmark series as watched
        await db
            .update(series)
            .set({
                isWatched: false,
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
        console.error('Error unmarking series as watched:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to unmark series as watched' },
            { status: 500 },
        )
    }
}
