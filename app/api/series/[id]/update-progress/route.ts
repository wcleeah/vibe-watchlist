import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { series, seriesConfig } from '@/lib/db/schema'
import { fetchSeriesWithTags } from '@/lib/db/series-helpers'
import type { UpdateProgressRequest } from '@/types/series'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/series/[id]/update-progress - Update episode progress
// Can either set absolute episodesWatched or increment by a value
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

        // Fetch the series_config row (episode data)
        const configRows = await db
            .select()
            .from(seriesConfig)
            .where(eq(seriesConfig.seriesId, seriesId))
            .limit(1)

        if (configRows.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'No config found for this series. Multi-season series should update progress per-season.',
                },
                { status: 400 },
            )
        }

        const config = configRows[0]
        const now = new Date()

        // Calculate new watched episodes count
        let newWatchedEpisodes: number
        if (episodesWatched !== undefined) {
            newWatchedEpisodes = Math.max(0, episodesWatched)
        } else {
            newWatchedEpisodes = Math.max(
                0,
                config.episodesWatched + (increment ?? 0),
            )
        }

        // Don't exceed episodes aired
        if (newWatchedEpisodes > config.episodesAired) {
            newWatchedEpisodes = config.episodesAired
        }

        // Update seriesConfig
        await db
            .update(seriesConfig)
            .set({
                episodesWatched: newWatchedEpisodes,
                lastWatchedAt: now,
                updatedAt: now,
            })
            .where(eq(seriesConfig.seriesId, seriesId))

        // Also update series.updatedAt
        await db
            .update(series)
            .set({ updatedAt: now })
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
        console.error('Error updating series progress:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update progress' },
            { status: 500 },
        )
    }
}
