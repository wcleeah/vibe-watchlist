import { NextRequest, NextResponse } from 'next/server';
import { aiMetadataService } from '@/lib/services/ai-metadata-service';
import { parseVideoUrlWithPlatforms } from '@/lib/utils/url-parser';
import { PlatformDataService } from '@/lib/services/platform-data-service';

export async function POST(request: NextRequest) {
  try {
    const { url, platform: providedPlatform } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required and must be a string' },
        { status: 400 }
      );
    }

    const platforms = await PlatformDataService.getPlatforms();
    const parsedUrl = parseVideoUrlWithPlatforms(url, platforms);
    if (!parsedUrl.isValid) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Use provided platform or detected platform
    const platform = providedPlatform || parsedUrl.platform;

    // Get enabled platforms from database for dynamic validation
    const enabledPlatforms = await PlatformDataService.getPlatforms();
    const validPlatformIds = enabledPlatforms.map(p => p.platformId);
    // Add 'unknown' for fallback platform
    const validPlatforms = [...validPlatformIds, 'unknown'];

    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    // Extract metadata with AI analysis
    const result = await aiMetadataService.extractMetadata(url);

    if (result.success) {
      return NextResponse.json({
        success: true,
        suggestions: result.suggestions,
        fallback: result.fallback,
        platform: platform,
        url: url,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to extract metadata' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('AI metadata extraction API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for checking cached suggestions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Check if we have cached suggestions for this URL
    const result = await aiMetadataService.extractMetadata(url);

    if (result.success && result.suggestions.length > 0) {
      return NextResponse.json({
        success: true,
        cached: true,
        suggestions: result.suggestions,
        fallback: result.fallback,
      });
    } else {
      return NextResponse.json({
        success: false,
        cached: false,
        message: 'No cached suggestions available',
      });
    }

  } catch (error) {
    console.error('AI metadata cache check error:', error);
    return NextResponse.json(
      { error: 'Failed to check cache' },
      { status: 500 }
    );
  }
}
