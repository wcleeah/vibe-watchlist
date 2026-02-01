import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { videos } from '@/lib/db/schema'

// PUT /api/videos/reorder - Reorder videos by updating sortOrder
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { orderedIds } = body

        if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
            return NextResponse.json(
                { error: 'orderedIds array is required' },
                { status: 400 },
            )
        }

        // Validate that all IDs are numbers
        if (!orderedIds.every((id) => typeof id === 'number')) {
            return NextResponse.json(
                { error: 'All IDs must be numbers' },
                { status: 400 },
            )
        }

        // Update sortOrder for each video based on array position
        // Using a transaction to ensure atomicity
        await db.transaction(async (tx) => {
            for (let i = 0; i < orderedIds.length; i++) {
                await tx
                    .update(videos)
                    .set({
                        sortOrder: i,
                        updatedAt: new Date(),
                    })
                    .where(eq(videos.id, orderedIds[i]))
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error reordering videos:', error)
        return NextResponse.json(
            { error: 'Failed to reorder videos' },
            { status: 500 },
        )
    }
}
