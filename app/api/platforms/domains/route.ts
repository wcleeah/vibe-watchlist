import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { platformConfigs } from '@/lib/db/schema'

// GET /api/platforms/domains - Get platform mapping for a domain
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const domain = searchParams.get('domain')

        if (!domain) {
            return NextResponse.json(
                { error: 'Domain parameter is required' },
                { status: 400 },
            )
        }

        // Find platform mapping for this domain by checking patterns
        const results = await db.select().from(platformConfigs)

        // Find platform where domain matches any pattern
        const matchingPlatform = results.find((platform) =>
            platform.patterns?.some(
                (pattern) =>
                    pattern.includes(domain) || domain.includes(pattern),
            ),
        )

        if (!matchingPlatform) {
            return NextResponse.json({
                success: true,
                platform: null,
                message: 'No platform mapping found for this domain',
            })
        }

        return NextResponse.json({
            success: true,
            platform: {
                id: matchingPlatform.platformId,
                name: matchingPlatform.displayName,
                platform: matchingPlatform.platformId, // For backward compatibility
                confidence: Number(matchingPlatform.confidenceScore),
                color: matchingPlatform.color,
                icon: matchingPlatform.icon,
            },
        })
    } catch (error) {
        console.error('Platform domain lookup error:', error)
        return NextResponse.json(
            { error: 'Failed to lookup platform mapping' },
            { status: 500 },
        )
    }
}

// POST /api/platforms/map - Update or create platform mapping
export async function POST(request: NextRequest) {
    try {
        const { domain, platformId, confidence = 0.8 } = await request.json()

        if (!domain || !platformId) {
            return NextResponse.json(
                { error: 'Domain and platformId are required' },
                { status: 400 },
            )
        }

        // Check if a platform config already includes this domain in patterns
        const existing = await db.select().from(platformConfigs)

        const existingMapping = existing.find((config) =>
            config.patterns?.some(
                (pattern) =>
                    pattern.includes(domain) || domain.includes(pattern),
            ),
        )

        if (existingMapping) {
            // Update existing mapping by adding domain to patterns if not present
            const updatedPatterns = existingMapping.patterns || []
            if (!updatedPatterns.some((pattern) => pattern.includes(domain))) {
                updatedPatterns.push(domain)
            }

            await db
                .update(platformConfigs)
                .set({
                    patterns: updatedPatterns,
                    confidenceScore: Math.max(
                        Number(existingMapping.confidenceScore),
                        confidence,
                    ).toString(),
                    updatedAt: new Date(),
                })
                .where(eq(platformConfigs.id, existingMapping.id))

            return NextResponse.json({
                success: true,
                action: 'updated',
                message: `Updated platform mapping for ${domain}`,
            })
        } else {
            // Create new mapping based on existing platform config
            const baseConfig = await db
                .select()
                .from(platformConfigs)
                .where(eq(platformConfigs.platformId, platformId))
                .limit(1)

            if (baseConfig.length === 0) {
                return NextResponse.json(
                    {
                        error: `Platform ${platformId} not found in configuration`,
                    },
                    { status: 400 },
                )
            }

            const config = baseConfig[0]

            // Insert new domain mapping
            await db.insert(platformConfigs).values({
                platformId: `${platformId}_${domain.replace(/[^a-zA-Z0-9]/g, '_')}`, // Unique ID
                name: `${domain} (${config.name})`,
                displayName: config.displayName,
                patterns: [domain], // Add domain as a pattern
                extractor: config.extractor,
                color: config.color,
                icon: config.icon,
                confidenceScore: confidence.toString(),
                isPreset: false,
                addedBy: 'ai-learning',
                metadata: { learned_domain: domain },
            })

            return NextResponse.json({
                success: true,
                action: 'created',
                message: `Created new platform mapping for ${domain}`,
            })
        }
    } catch (error) {
        console.error('Platform mapping update error:', error)
        return NextResponse.json(
            { error: 'Failed to update platform mapping' },
            { status: 500 },
        )
    }
}
