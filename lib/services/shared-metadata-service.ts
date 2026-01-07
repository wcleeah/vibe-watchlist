export interface VideoMetadata {
  title: string;
  thumbnailUrl: string | null;
  authorName?: string;
  authorUrl?: string;
}


/**
 * Resolves Twitch thumbnail URL templates
 */
function resolveTwitchThumbnailUrl(templateUrl: string, width = 320, height = 180): string {
  if (!templateUrl) return templateUrl;

  return templateUrl
    .replace(/%{width}/g, width.toString())
    .replace(/%{height}/g, height.toString())
    .replace(/{width}/g, width.toString())
    .replace(/{height}/g, height.toString());
}

/**
 * Get Twitch access token for API calls
 */
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
      console.log(
        "🔑 TWITCH TOKEN: Token request failed with status:",
        response.status,
      );

      // Log response body for debugging
      try {
        const errorBody = await response.text();
        console.log(
          "🔑 TWITCH TOKEN: Error response body:",
          errorBody.substring(0, 500),
        );
      } catch (bodyError) {
        console.log(
          "🔑 TWITCH TOKEN: Could not read error response body:",
          bodyError,
        );
      }

      throw new Error(`Twitch token request failed: ${response.status}`);
    }

  const data = await response.json();
  return data.access_token;
}

export class SharedMetadataService {
  /**
   * Extract metadata from YouTube using oEmbed API
   */
  static async extractYouTubeMetadata(url: string): Promise<VideoMetadata> {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

    const response = await fetch(oEmbedUrl, {
      headers: {
        'User-Agent': 'Video Watchlist AI/1.0',
      },
    });

    if (!response.ok) {
      console.log(
        "📺 YOUTUBE OEMBED: API request failed with status:",
        response.status,
      );

      // Log response body for debugging
      try {
        const errorBody = await response.text();
        console.log(
          "📺 YOUTUBE OEMBED: Error response body:",
          errorBody.substring(0, 500),
        );
      } catch (bodyError) {
        console.log(
          "📺 YOUTUBE OEMBED: Could not read error response body:",
          bodyError,
        );
      }

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

  /**
   * Extract metadata from Twitch using Helix API
   */
  static async extractTwitchMetadata(url: string): Promise<VideoMetadata> {
    const { parseVideoUrl } = await import('@/lib/utils/url-parser');
    const parsed = await parseVideoUrl(url);

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
      console.log(
        "🎮 TWITCH HELIX: API request failed with status:",
        response.status,
      );

      // Log response body for debugging
      try {
        const errorBody = await response.text();
        console.log(
          "🎮 TWITCH HELIX: Error response body:",
          errorBody.substring(0, 500),
        );
      } catch (bodyError) {
        console.log(
          "🎮 TWITCH HELIX: Could not read error response body:",
          bodyError,
        );
      }

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

  /**
   * Extract basic metadata from HTML (fallback for unknown platforms)
   */
  static async extractHtmlMetadata(url: string): Promise<VideoMetadata> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Video Watchlist AI/1.0',
        },
      });

      if (!response.ok) {
        console.log(
          "🌐 HTML METADATA FETCH: HTTP request failed with status:",
          response.status,
        );

        // Log response body for debugging
        try {
          const errorBody = await response.text();
          console.log(
            "🌐 HTML METADATA FETCH: Error response body:",
            errorBody.substring(0, 500),
          );
        } catch (bodyError) {
          console.log(
            "🌐 HTML METADATA FETCH: Could not read error response body:",
            bodyError,
          );
        }

        throw new Error(`Failed to fetch HTML: ${response.status}`);
      }

      const html = await response.text();
      const { MetascraperService } = await import('./metascraper-service');
      const metadata = await MetascraperService.extractMetadata(html, url);

      return {
        title: metadata.title || metadata.ogTitle || metadata.twitterTitle || 'Untitled Video',
        thumbnailUrl: metadata.ogImage || metadata.twitterImage || null,
      };
    } catch (error) {
      console.error('HTML metadata extraction failed:', error);
      return {
        title: 'Untitled Video',
        thumbnailUrl: null,
      };
    }
  }

  /**
   * Determine the extraction strategy for a given platform
   */
  static getPlatformStrategy(platform: string): 'official' | 'ai' | 'fallback' {
    const OFFICIAL_PLATFORMS = ['youtube', 'twitch'];
    const AI_SUPPORTED_PLATFORMS = ['unknown', 'netflix', 'nebula', 'vimeo'];

    if (OFFICIAL_PLATFORMS.includes(platform)) {
      return 'official';
    }

    if (AI_SUPPORTED_PLATFORMS.includes(platform)) {
      return 'ai';
    }

    return 'fallback';
  }
}
