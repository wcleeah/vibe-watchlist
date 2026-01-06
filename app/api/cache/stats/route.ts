import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiMetadataCache } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiMetadataCache);

    const total = totalResult[0]?.count || 0;

    // Get expired count
    const now = new Date();
    const expiredResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiMetadataCache)
      .where(sql`${aiMetadataCache.expiresAt} < ${now}`);

    const expired = expiredResult[0]?.count || 0;

    // Get average confidence score
    const confidenceResult = await db
      .select({ avg: sql<number>`avg(${aiMetadataCache.confidenceScore})` })
      .from(aiMetadataCache);

    const avgConfidence = confidenceResult[0]?.avg || 0;

    // Get oldest and newest entries
    const oldestResult = await db
      .select({ createdAt: aiMetadataCache.createdAt })
      .from(aiMetadataCache)
      .orderBy(aiMetadataCache.createdAt)
      .limit(1);

    const newestResult = await db
      .select({ createdAt: aiMetadataCache.createdAt })
      .from(aiMetadataCache)
      .orderBy(sql`${aiMetadataCache.createdAt} desc`)
      .limit(1);

    const oldestEntry = oldestResult[0]?.createdAt;
    const newestEntry = newestResult[0]?.createdAt;

    // Estimate cache size (rough calculation)
    // Each entry has URL (~100 chars), search results (~1000 chars), extracted metadata (~500 chars), ai analysis (~300 chars)
    const estimatedSizeBytes = total * (100 + 1000 + 500 + 300);
    const estimatedSizeMB = (estimatedSizeBytes / (1024 * 1024)).toFixed(2);

    return NextResponse.json({
      success: true,
      stats: {
        total,
        active: total - expired,
        expired,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        estimatedSize: `${estimatedSizeMB} MB`,
        oldestEntry: oldestEntry?.toISOString(),
        newestEntry: newestEntry?.toISOString(),
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to fetch cache statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cache statistics' },
      { status: 500 }
    );
  }
}