import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { platformConfigs } from '@/lib/db/schema'

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: platformId } = await params

        const platform = await db
            .select()
            .from(platformConfigs)
            .where(eq(platformConfigs.platformId, platformId))
            .limit(1)

        if (platform.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Platform not found' },
                { status: 404 },
            )
        }

        return NextResponse.json({
            success: true,
            data: platform[0],
        })
    } catch (error) {
        console.error('Failed to fetch platform:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch platform' },
            { status: 500 },
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: platformId } = await params
        const updates = await request.json()

        // Check if platform exists and get current data
        const existing = await db
            .select()
            .from(platformConfigs)
            .where(eq(platformConfigs.platformId, platformId))
            .limit(1)

        if (existing.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Platform not found' },
                { status: 404 },
            )
        }

        const currentPlatform = existing[0]

        // Prevent updating preset platforms with restricted fields
        if (currentPlatform.isPreset) {
            const restrictedFields = [
                'platformId',
                'name',
                'patterns',
                'extractor',
                'isPreset',
            ]
            const hasRestrictedUpdate = restrictedFields.some(
                (field) => updates[field] !== undefined,
            )

            if (hasRestrictedUpdate) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Cannot modify core fields of preset platforms',
                    },
                    { status: 403 },
                )
            }
        }

        // Validate patterns if provided
        if (updates.patterns) {
            if (!Array.isArray(updates.patterns)) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'patterns must be an array of strings',
                    },
                    { status: 400 },
                )
            }

            const validPatterns = updates.patterns.filter(
                (p: unknown): p is string =>
                    typeof p === 'string' && p.trim().length > 0,
            )
            if (validPatterns.length === 0) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'At least one valid pattern is required',
                    },
                    { status: 400 },
                )
            }
            updates.patterns = validPatterns
        }

        // Validate confidence score if provided
        if (updates.confidenceScore !== undefined) {
            const score = parseFloat(updates.confidenceScore)
            if (Number.isNaN(score) || score < 0 || score > 1) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Confidence score must be between 0 and 1',
                    },
                    { status: 400 },
                )
            }
            updates.confidenceScore = score.toString()
        }

        // Update the platform
        const updateData = {
            ...updates,
            updatedAt: new Date(),
        }

        const result = await db
            .update(platformConfigs)
            .set(updateData)
            .where(eq(platformConfigs.platformId, platformId))
            .returning()

        return NextResponse.json({
            success: true,
            data: result[0],
            message: 'Platform updated successfully',
        })
    } catch (error) {
        console.error('Failed to update platform:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update platform' },
            { status: 500 },
        )
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: platformId } = await params

        // Check if platform exists and if it's a preset
        const existing = await db
            .select()
            .from(platformConfigs)
            .where(eq(platformConfigs.platformId, platformId))
            .limit(1)

        if (existing.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Platform not found' },
                { status: 404 },
            )
        }

        if (existing[0].isPreset) {
            return NextResponse.json(
                { success: false, error: 'Cannot delete preset platforms' },
                { status: 403 },
            )
        }

        // Delete the platform
        await db
            .delete(platformConfigs)
            .where(eq(platformConfigs.platformId, platformId))

        return NextResponse.json({
            success: true,
            message: 'Platform deleted successfully',
        })
    } catch (error) {
        console.error('Failed to delete platform:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete platform' },
            { status: 500 },
        )
    }
}
