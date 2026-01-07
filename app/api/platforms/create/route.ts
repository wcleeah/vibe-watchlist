import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { platformConfigs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const {
      platformId,
      name,
      displayName,
      patterns,
      color,
      icon,
      extractor = 'fallback',
      confidenceScore = 1.0
    } = await request.json();

    if (!platformId || !name || !displayName || !patterns || !Array.isArray(patterns)) {
      return NextResponse.json(
        { error: 'Missing required fields: platformId, name, displayName, patterns' },
        { status: 400 }
      );
    }

    // Check if platform already exists
    const existing = await db
      .select()
      .from(platformConfigs)
      .where(eq(platformConfigs.platformId, platformId))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Platform with this ID already exists' },
        { status: 409 }
      );
    }

    // Create new platform
    const newPlatform = await db
      .insert(platformConfigs)
      .values({
        platformId,
        name,
        displayName,
        patterns,
        extractor,
        color: color || '#6b7280',
        icon: icon || 'Video',
        confidenceScore,
        isPreset: false,
        addedBy: 'user',
      })
      .returning();

    console.log('✅ Platform Creation API: Created platform:', newPlatform[0]);

    return NextResponse.json({
      success: true,
      platform: newPlatform[0]
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Platform Creation API: Failed:', error);
    return NextResponse.json(
      { error: 'Failed to create platform' },
      { status: 500 }
    );
  }
}