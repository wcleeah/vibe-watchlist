import { type NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/services/ai-service'

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json()

        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 },
            )
        }

        console.log('🌐 Platform Discovery API: Analyzing URL:', url)

        const suggestion = await aiService.detectPlatform(url)

        console.log('✅ Platform Discovery API: Found suggestion:', suggestion)

        return NextResponse.json({
            success: true,
            suggestion,
        })
    } catch (error) {
        console.error('❌ Platform Discovery API: Failed:', error)
        return NextResponse.json(
            { error: 'Failed to detect platform' },
            { status: 500 },
        )
    }
}
