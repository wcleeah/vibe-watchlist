import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiMetadataCache } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiMetadataCache);

    const total = totalResult[0]?.count || 0;

    // Get paginated entries
    const entries = await db
      .select()
      .from(aiMetadataCache)
      .orderBy(desc(aiMetadataCache.createdAt))
      .limit(limit)
      .offset(offset);

    // Calculate statistics
    const now = new Date();
    const expiredCount = entries.filter(entry => new Date(entry.expiresAt) < now).length;

    return NextResponse.json({
      success: true,
      data: {
        entries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          total,
          expired: expiredCount,
          active: total - expiredCount,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch cache entries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cache entries' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clearAll = searchParams.get('all') === 'true';

    if (clearAll) {
      // Clear all cache entries
      const result = await db.delete(aiMetadataCache);
      return NextResponse.json({
        success: true,
        message: 'All cache entries cleared',
        deletedCount: result.rowCount || 0,
      });
    } else {
      // Clear only expired entries
      const now = new Date();
      const result = await db
        .delete(aiMetadataCache)
        .where(sql`${aiMetadataCache.expiresAt} < ${now}`);

      return NextResponse.json({
        success: true,
        message: 'Expired cache entries cleared',
        deletedCount: result.rowCount || 0,
      });
    }
  } catch (error) {
    console.error('Failed to clear cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}