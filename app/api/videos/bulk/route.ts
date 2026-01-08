import { inArray } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { videos } from '@/lib/db/schema'
import { logEvent } from '@/lib/analytics/events'

// POST /api/videos/bulk - Bulk operations (mark watched, delete)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { operation, videoIds } = body

        if (
            !operation ||
            !videoIds ||
            !Array.isArray(videoIds) ||
            videoIds.length === 0
        ) {
            return NextResponse.json(
                { error: 'Operation and videoIds array are required' },
                { status: 400 },
            )
        }

        if (!['markWatched', 'markUnwatched', 'delete'].includes(operation)) {
            return NextResponse.json(
                {
                    error: 'Invalid operation. Must be: markWatched, markUnwatched, or delete',
                },
                { status: 400 },
            )
        }

        // Validate that all videoIds are numbers
        const validVideoIds = videoIds.filter(
            (id) => typeof id === 'number' && !Number.isNaN(id),
        )
        if (validVideoIds.length !== videoIds.length) {
            return NextResponse.json(
                { error: 'All videoIds must be valid numbers' },
                { status: 400 },
            )
        }

        let result: { id: number }[] = []

        switch (operation) {
            case 'markWatched':
                result = await db
                    .update(videos)
                    .set({ isWatched: true, updatedAt: new Date() })
                    .where(inArray(videos.id, validVideoIds))
                    .returning({ id: videos.id })
                break

            case 'markUnwatched':
                result = await db
                    .update(videos)
                    .set({ isWatched: false, updatedAt: new Date() })
                    .where(inArray(videos.id, validVideoIds))
                    .returning({ id: videos.id })
                break

            case 'delete':
                result = await db
                    .delete(videos)
                    .where(inArray(videos.id, validVideoIds))
                    .returning({ id: videos.id })
                break
        }

        // Log bulk operation event
        logEvent('bulk_operation', {
            operation,
            count: result.length,
            videoIds: result.map((r) => r.id),
        })

        return NextResponse.json({
            operation,
            affectedCount: result.length,
            videoIds: result.map((r) => r.id),
        })
    } catch (error) {
        console.error('Error performing bulk operation:', error)
        logEvent('error_occurred', {
            operation: 'bulk_operation',
            error: error instanceof Error ? error.message : 'Unknown error',
            endpoint: 'videos/bulk',
        })
        return NextResponse.json(
            { error: 'Failed to perform bulk operation' },
            { status: 500 },
        )
    }
}
