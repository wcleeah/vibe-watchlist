import { VideoPlatform } from './url-parser';

export interface VideoMetadata {
  title: string;
  thumbnailUrl: string | null;
  authorName?: string;
  authorUrl?: string;
}

/**
 * Client-side metadata extraction that securely calls the backend API
 * All external API calls and credentials are handled server-side
 */
export async function extractVideoMetadata(url: string, platform: VideoPlatform): Promise<VideoMetadata> {
  try {
    // Call the secure backend API for all metadata extraction
    const response = await fetch('/api/metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, platform }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Metadata extraction failed');
    }

    return data.metadata;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    // Fallback to basic platform name if API fails
    return {
      title: `Video from ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
      thumbnailUrl: null,
    };
  }
}