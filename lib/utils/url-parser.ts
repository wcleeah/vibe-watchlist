export type VideoPlatform = 'youtube' | 'netflix' | 'nebula' | 'twitch' | 'unknown';

export interface ParsedUrl {
  url: string;
  platform: VideoPlatform;
  videoId?: string;
  playlistId?: string;
  isValid: boolean;
}

export function parseVideoUrl(url: string): ParsedUrl {
  if (!url || typeof url !== 'string') {
    return { url, platform: 'unknown', isValid: false };
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // YouTube detection
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      const videoId = extractYouTubeId(urlObj);
      const playlistId = extractYouTubePlaylistId(urlObj);

      if (videoId) {
        return {
          url,
          platform: 'youtube',
          videoId,
          isValid: true,
        };
      }
      if (playlistId) {
        return {
          url,
          platform: 'youtube',
          playlistId,
          isValid: true,
        };
      }
    }

    // Netflix detection
    if (hostname.includes('netflix.com')) {
      return {
        url,
        platform: 'netflix',
        isValid: true,
      };
    }

    // Nebula detection
    if (hostname.includes('nebula.tv') || hostname.includes('nebula.app') || hostname.includes('watchnebula.com')) {
      return {
        url,
        platform: 'nebula',
        isValid: true,
      };
    }

    // Twitch detection
    if (hostname.includes('twitch.tv')) {
      const videoId = extractTwitchId(urlObj);
      return {
        url,
        platform: 'twitch',
        videoId,
        isValid: true,
      };
    }

    // Accept any valid HTTPS URL
    return {
      url,
      platform: 'unknown',
      isValid: true,
    };
  } catch {
    return { url, platform: 'unknown', isValid: false };
  }
}

function extractYouTubeId(urlObj: URL): string | null {
  const hostname = urlObj.hostname.toLowerCase();

  // youtube.com/watch?v=VIDEO_ID
  if (hostname.includes('youtube.com')) {
    const videoId = urlObj.searchParams.get('v');
    if (videoId && videoId.length === 11) {
      return videoId;
    }
  }

  // youtu.be/VIDEO_ID
  if (hostname.includes('youtu.be')) {
    const path = urlObj.pathname.slice(1); // remove leading /
    if (path.length === 11) {
      return path;
    }
  }

  return null;
}

function extractYouTubePlaylistId(urlObj: URL): string | null {
  const playlistId = urlObj.searchParams.get('list');
  if (playlistId && playlistId.startsWith('PL') && playlistId.length > 2) {
    return playlistId;
  }
  return null;
}

function extractTwitchId(urlObj: URL): string | undefined {
  const path = urlObj.pathname;

  // twitch.tv/videos/{id}
  const videoMatch = path.match(/^\/videos\/(\d+)$/);
  if (videoMatch) {
    return videoMatch[1];
  }

  return undefined;
}

export function detectPlatform(url: string): VideoPlatform | null {
  const parsed = parseVideoUrl(url);
  return parsed.isValid ? parsed.platform : null;
}