import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { comingSoon } from '@/lib/db/schema'

// PUT /api/coming-soon/reorder - Reorder coming soon items by updating sortOrder
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

        if (!orderedIds.every((id) => typeof id === 'number')) {
            return NextResponse.json(
                { error: 'All IDs must be numbers' },
                { status: 400 },
            )
        }

        await Promise.all(
            orderedIds.map((id, index) =>
                db
                    .update(comingSoon)
                    .set({
                        sortOrder: index,
                        updatedAt: new Date(),
                    })
                    .where(eq(comingSoon.id, id)),
            ),
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error reordering coming soon items:', error)
        return NextResponse.json(
            { error: 'Failed to reorder coming soon items' },
            { status: 500 },
        )
    }
}
