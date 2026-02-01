import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { series } from '@/lib/db/schema'

// PUT /api/series/reorder - Reorder series by updating sortOrder
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

        // Update sortOrder for each series based on array position
        // Using Promise.all for batch updates (neon-http doesn't support transactions)
        await Promise.all(
            orderedIds.map((id, index) =>
                db
                    .update(series)
                    .set({
                        sortOrder: index,
                        updatedAt: new Date(),
                    })
                    .where(eq(series.id, id)),
            ),
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error reordering series:', error)
        return NextResponse.json(
            { error: 'Failed to reorder series' },
            { status: 500 },
        )
    }
}
