import { extractVideoMetadata, VideoMetadata } from '@/lib/utils/metadata-extractor';
import { VideoPlatform } from '@/lib/utils/url-parser';

export class MetadataService {
  private static readonly CACHE = new Map<string, { data: VideoMetadata; timestamp: number }>();
  private static readonly CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

  static async fetchMetadata(url: string, platform: VideoPlatform): Promise<VideoMetadata> {
    // Check cache first
    const cacheKey = `${platform}:${url}`;
    const cached = this.CACHE.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const metadata = await extractVideoMetadata(url, platform);

      // Cache the result
      this.CACHE.set(cacheKey, {
        data: metadata,
        timestamp: Date.now(),
      });

      return metadata;
    } catch (error) {
      console.error('Metadata fetch failed:', error);
      throw error;
    }
  }

  static clearCache(): void {
    this.CACHE.clear();
  }

  static clearCacheFor(url: string, platform: VideoPlatform): void {
    const cacheKey = `${platform}:${url}`;
    this.CACHE.delete(cacheKey);
  }

  static getCacheSize(): number {
    return this.CACHE.size;
  }

  static async validateUrl(url: string, platform: VideoPlatform): Promise<boolean> {
    try {
      // For now, just try to fetch metadata as a validation
      await this.fetchMetadata(url, platform);
      return true;
    } catch {
      return false;
    }
  }
}