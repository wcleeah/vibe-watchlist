import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { platformConfigs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid URL is required' },
        { status: 400 }
      );
    }

    // Fetch all enabled platforms
    const platforms = await db
      .select()
      .from(platformConfigs)
      .where(eq(platformConfigs.enabled, true));

    const results = platforms.map(platform => {
      // Test URL against each pattern
      const matched = platform.patterns.some(pattern => {
        try {
          // Convert glob pattern to regex
          const regexPattern = pattern
            .replace(/\*/g, '.*') // * becomes .*
            .replace(/\?/g, '.')  // ? becomes .
            .replace(/\//g, '\\/'); // Escape forward slashes

          const regex = new RegExp(`^${regexPattern}$`, 'i');
          return regex.test(url);
        } catch (error) {
          // If pattern is invalid, skip it
          console.warn(`Invalid pattern "${pattern}" for platform ${platform.platformId}:`, error);
          return false;
        }
      });

      return {
        platformId: platform.platformId,
        displayName: platform.displayName,
        matched,
        confidence: matched ? parseFloat(platform.confidenceScore || '0.5') : 0,
        extractor: platform.extractor,
      };
    });

    // Sort results: matched first, then by confidence descending
    results.sort((a, b) => {
      if (a.matched && !b.matched) return -1;
      if (!a.matched && b.matched) return 1;
      return b.confidence - a.confidence;
    });

    return NextResponse.json({
      success: true,
      url,
      results,
    });

  } catch (error) {
    console.error('Failed to test platform patterns:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test platform patterns' },
      { status: 500 }
    );
  }
}