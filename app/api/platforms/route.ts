import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { platformConfigs } from '@/lib/db/schema'

export async function GET() {
    try {
        const platforms = await db
            .select()
            .from(platformConfigs)
            .where(eq(platformConfigs.enabled, true))

        return NextResponse.json({ success: true, data: platforms })
    } catch (error) {
        console.error('Failed to fetch platforms:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch platforms' },
            { status: 500 },
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const config = await request.json()

        // Validate required fields
        if (
            !config.platformId ||
            !config.name ||
            !config.displayName ||
            !config.patterns
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: platformId, name, displayName, patterns',
                },
                { status: 400 },
            )
        }

        // Validate patterns is an array
        if (!Array.isArray(config.patterns)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'patterns must be an array of strings',
                },
                { status: 400 },
            )
        }

        // Check if platform already exists
        const existing = await db
            .select()
            .from(platformConfigs)
            .where(eq(platformConfigs.platformId, config.platformId))
            .limit(1)

        if (existing.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Platform with this ID already exists',
                },
                { status: 409 },
            )
        }

        // Insert new platform
        const newPlatform = {
            platformId: config.platformId,
            name: config.name,
            displayName: config.displayName,
            patterns: config.patterns,
            extractor: config.extractor || 'ai',
            color: config.color || '#6b7280',
            icon: config.icon || 'Video',
            enabled: config.enabled !== false, // Default true unless explicitly false
            isPreset: false, // User-created platforms are not presets
            addedBy: config.addedBy || 'user',
            confidenceScore: config.confidenceScore || '0.5',
            metadata: config.metadata || null,
        }

        const result = await db
            .insert(platformConfigs)
            .values(newPlatform)
            .returning()

        return NextResponse.json(
            {
                success: true,
                data: result[0],
                message: 'Platform created successfully',
            },
            { status: 201 },
        )
    } catch (error) {
        console.error('Failed to create platform:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create platform' },
            { status: 500 },
        )
    }
}
