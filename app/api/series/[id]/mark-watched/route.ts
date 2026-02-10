import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { series } from '@/lib/db/schema'
import { fetchSeriesWithTags } from '@/lib/db/series-helpers'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/series/[id]/mark-watched - Mark a series as watched (finished)
// Sets isWatched: true to move series to the Watched tab
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

        // Mark series as watched
        await db
            .update(series)
            .set({
                isWatched: true,
                lastWatchedAt: now,
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
        console.error('Error marking series as watched:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to mark series as watched' },
            { status: 500 },
        )
    }
}
