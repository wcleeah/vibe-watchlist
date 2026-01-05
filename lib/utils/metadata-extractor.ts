import { VideoPlatform } from './url-parser';
import { PLATFORM_NAMES } from './platform-utils';

export interface VideoMetadata {
  title: string;
  thumbnailUrl: string | null;
  authorName?: string;
  authorUrl?: string;
}

export async function extractVideoMetadata(url: string, platform: VideoPlatform): Promise<VideoMetadata> {
  try {
    switch (platform) {
      case 'youtube':
        return await extractYouTubeMetadata(url);
      case 'netflix':
      case 'nebula':
      case 'twitch':
        // For now, return basic metadata without API calls
        return {
          title: `Video from ${PLATFORM_NAMES[platform]}`,
          thumbnailUrl: null,
        };
      default:
        // Try meta tag extraction for unknown platforms
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

    return {
      title: title || 'Untitled Video',
      thumbnailUrl,
    };
  } catch (error) {
    console.error('Error extracting meta tag metadata:', error);
    throw error;
  }
}