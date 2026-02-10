import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { series } from '@/lib/db/schema'
import { fetchSeriesWithTags } from '@/lib/db/series-helpers'

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
        const seriesWithTags = await fetchSeriesWithTags(seriesId)

        if (!seriesWithTags) {
            return NextResponse.json(
                { success: false, error: 'Series not found' },
                { status: 404 },
            )
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
