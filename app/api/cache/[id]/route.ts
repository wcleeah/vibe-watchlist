import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiMetadataCache } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const cacheId = params.id;

    // Validate that the ID is a valid format (should be a string from the database)
    if (!cacheId || typeof cacheId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid cache entry ID' },
        { status: 400 }
      );
    }

    // Check if the cache entry exists
    const existing = await db
      .select()
      .from(aiMetadataCache)
      .where(eq(aiMetadataCache.id, parseInt(cacheId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cache entry not found' },
        { status: 404 }
      );
    }

    // Delete the cache entry
    const result = await db
      .delete(aiMetadataCache)
      .where(eq(aiMetadataCache.id, parseInt(cacheId)));

    if (result.rowCount && result.rowCount > 0) {
      return NextResponse.json({
        success: true,
        message: 'Cache entry deleted successfully',
        deletedCount: result.rowCount,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to delete cache entry' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Failed to delete cache entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete cache entry' },
      { status: 500 }
    );
  }
}