import { NextRequest, NextResponse } from 'next/server';
import { VideoPlatform, parseVideoUrl } from '@/lib/utils/url-parser';
import { PLATFORM_NAMES } from '@/lib/utils/platform-utils';

interface VideoMetadata {
  title: string;
  thumbnailUrl: string | null;
  authorName?: string;
  authorUrl?: string;
}

/**
 * Resolves Twitch thumbnail URL templates by replacing width/height placeholders
 * Twitch API returns URLs like: thumb/thumb0-%{width}x%{height}.jpg
 * We convert to: thumb/thumb0-320x180.jpg
 */
function resolveTwitchThumbnailUrl(templateUrl: string, width = 320, height = 180): string {
  if (!templateUrl) return templateUrl;

  return templateUrl
    .replace(/%{width}/g, width.toString())
    .replace(/%{height}/g, height.toString())
    .replace(/{width}/g, width.toString())    // Alternative format
    .replace(/{height}/g, height.toString());
}
async function extractYouTubeMetadata(url: string): Promise<VideoMetadata> {
  const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

  const response = await fetch(oEmbedUrl, {
    headers: {
      'User-Agent': 'Video Watchlist App/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`YouTube oEmbed API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    title: data.title || 'Untitled YouTube Video',
    thumbnailUrl: data.thumbnail_url || null,
    authorName: data.author_name,
    authorUrl: data.author_url,
  };
}

async function extractTwitchMetadata(url: string): Promise<VideoMetadata> {
  const parsed = parseVideoUrl(url);
  if (!parsed.videoId) {
    throw new Error('Invalid Twitch video URL');
  }

  const accessToken = await getTwitchAccessToken();

  const apiUrl = `https://api.twitch.tv/helix/videos?id=${parsed.videoId}`;

  const response = await fetch(apiUrl, {
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID!,
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Twitch video not found or private');
    }
    throw new Error(`Twitch API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.data || data.data.length === 0) {
    throw new Error('Twitch video data not found');
  }

  const video = data.data[0];

  return {
    title: video.title || 'Untitled Twitch Video',
    thumbnailUrl: video.thumbnail_url ? resolveTwitchThumbnailUrl(video.thumbnail_url) : null,
    authorName: video.user_name,
    authorUrl: video.user_login ? `https://twitch.tv/${video.user_login}` : undefined,
  };
}

async function getTwitchAccessToken(): Promise<string> {
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    throw new Error(`Twitch token request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function extractGoogleMetadata(url: string): Promise<VideoMetadata> {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // Construct search query: site:domain.com url_path
    const path = urlObj.pathname.slice(1, 50); // first 50 chars of path
    const query = `site:${domain} ${path}`;

    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CSE_ID}&q=${encodeURIComponent(query)}&num=1`;

    const response = await fetch(searchUrl);

    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error('No search results found');
    }

    const result = data.items[0];

    // Extract title and try to find image from snippet or pagemap
    let thumbnailUrl = null;
    if (result.pagemap && result.pagemap.cse_image) {
      thumbnailUrl = result.pagemap.cse_image[0].src;
    }

    return {
      title: result.title || 'Untitled Video',
      thumbnailUrl,
    };
  } catch (error) {
    console.error('Error extracting Google metadata:', error);
    throw error;
  }
}

async function extractMetaTagMetadata(url: string): Promise<VideoMetadata> {
  try {
    // Fetch the page HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Video Watchlist App/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();

    // Extract title from various sources
    let title = '';

    // Try Open Graph title
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (ogTitleMatch) {
      title = ogTitleMatch[1];
    }

    // Try Twitter title
    if (!title) {
      const twitterTitleMatch = html.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i);
      if (twitterTitleMatch) {
        title = twitterTitleMatch[1];
      }
    }

    // Try document title
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
    }

    // Extract thumbnail
    let thumbnailUrl = null;

    // Try Open Graph image
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (ogImageMatch) {
      thumbnailUrl = ogImageMatch[1];
    }

    // Try Twitter image
    if (!thumbnailUrl) {
      const twitterImageMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
      if (twitterImageMatch) {
        thumbnailUrl = twitterImageMatch[1];
      }
    }

    // If we got basic metadata, return it
    if (title) {
      return {
        title: title || 'Untitled Video',
        thumbnailUrl,
      };
    }

    // Fallback to Google Search if meta tags didn't provide title
    console.log('Meta tags insufficient, trying Google Search');
    return await extractGoogleMetadata(url);
  } catch (error) {
    console.error('Error extracting meta tag metadata:', error);

    // Try Google as last resort
    try {
      console.log('Meta extraction failed, trying Google Search');
      return await extractGoogleMetadata(url);
    } catch (googleError) {
      console.error('Google fallback also failed:', googleError);
      throw error; // throw original error
    }
  }
}

async function extractVideoMetadata(url: string, platform: VideoPlatform): Promise<VideoMetadata> {
  try {
    switch (platform) {
      case 'youtube':
        return await extractYouTubeMetadata(url);
      case 'twitch':
        return await extractTwitchMetadata(url);
      case 'netflix':
      case 'nebula':
      default:
        // Try meta tag extraction with Google fallback for all platforms without specific APIs
        return await extractMetaTagMetadata(url);
    }
  } catch (error) {
    console.error('Error extracting metadata:', error);
    // Fallback
    return {
      title: `Video from ${PLATFORM_NAMES[platform] || 'Unknown Platform'}`,
      thumbnailUrl: null,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, platform } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required and must be a string' },
        { status: 400 }
      );
    }

    if (!platform || !['youtube', 'twitch', 'netflix', 'nebula', 'unknown'].includes(platform)) {
      return NextResponse.json(
        { error: 'Valid platform is required' },
        { status: 400 }
      );
    }

    const metadata = await extractVideoMetadata(url, platform as VideoPlatform);

    return NextResponse.json({
      success: true,
      metadata
    });

  } catch (error) {
    console.error('Metadata extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract metadata', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}