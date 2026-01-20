import { type NextRequest, NextResponse } from 'next/server'
import { APIUsageService } from '@/lib/services/api-usage-service'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const operation = searchParams.get('operation')
        const limit = parseInt(searchParams.get('limit') || '25', 10)
        const offset = parseInt(searchParams.get('offset') || '0', 10)

        const [summary, requests] = await Promise.all([
            APIUsageService.getSummary(),
            APIUsageService.getRequests(operation, limit, offset),
        ])

        return NextResponse.json({ summary, requests })
    } catch (error) {
        console.error('Error fetching usage stats:', error)
        return NextResponse.json(
            { error: 'Failed to fetch usage stats' },
            { status: 500 },
        )
    }
}
