import { NextResponse } from 'next/server'

import { SeriesUpdateService } from '@/lib/services/series-update-service'

// POST /api/series/trigger-update - Manually trigger series schedule update
export async function POST() {
    try {
        const result = await SeriesUpdateService.updateSeriesSchedules()

        return NextResponse.json({
            success: true,
            result,
        })
    } catch (error) {
        console.error('Error triggering series update:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to trigger series update' },
            { status: 500 },
        )
    }
}
