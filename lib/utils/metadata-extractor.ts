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
        throw new Error(`Unsupported platform: ${platform}`);
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