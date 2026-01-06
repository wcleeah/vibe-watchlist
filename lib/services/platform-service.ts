import { PlatformConfig } from '@/lib/db/schema';

export class PlatformService {
  // Cache platforms for performance with TTL
  private static cache: PlatformConfig[] | null = null;
  private static cacheExpiry = 0;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all enabled platforms from the database
   */
  static async getPlatforms(): Promise<PlatformConfig[]> {
    // Return cached platforms if valid
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    // Fetch from API and cache
    try {
      const response = await fetch('/api/platforms');
      if (response.ok) {
        const data = await response.json();
        this.cache = data;
        this.cacheExpiry = Date.now() + this.CACHE_TTL;
        return data;
      }
    } catch (error) {
      console.error('Failed to fetch platforms:', error);
    }

    return [];
  }

  /**
   * Get platform configurations as a lookup map
   */
  static async getPlatformMap(): Promise<Record<string, PlatformConfig>> {
    const platforms = await this.getPlatforms();
    return platforms.reduce((map, p) => {
      map[p.platformId] = p;
      return map;
    }, {} as Record<string, PlatformConfig>);
  }

  /**
   * Get platform filter options for UI components
   */
  static async getPlatformFilters(): Promise<Array<{
    key: string;
    label: string;
    icon: string;
    color: string;
  }>> {
    const platforms = await this.getPlatforms();

    return platforms
      .filter(p => p.enabled)
      .map(platform => ({
        key: platform.platformId,
        label: platform.displayName,
        icon: platform.icon || 'Video',
        color: `hover:${platform.color || '#6b7280'}50 dark:hover:${platform.color || '#6b7280'}950`,
      }));
  }

  /**
   * Get platform icon mappings for components
   */
  static async getPlatformIcons(): Promise<Record<string, string>> {
    const platforms = await this.getPlatforms();
    return platforms.reduce((map, p) => {
      map[p.platformId] = p.icon || 'Video';
      return map;
    }, {} as Record<string, string>);
  }

  /**
   * Get platform color mappings for components
   */
  static async getPlatformColors(): Promise<Record<string, string>> {
    const platforms = await this.getPlatforms();
    return platforms.reduce((map, p) => {
      map[p.platformId] = p.color || '#6b7280';
      return map;
    }, {} as Record<string, string>);
  }

  /**
   * Get platform display names
   */
  static async getPlatformNames(): Promise<Record<string, string>> {
    const platforms = await this.getPlatforms();
    return platforms.reduce((map, p) => {
      map[p.platformId] = p.displayName;
      return map;
    }, {} as Record<string, string>);
  }

  /**
   * Get platform theme configurations
   */
  static async getPlatformThemes(): Promise<Record<string, {
    backgroundClass: string;
    borderClass: string;
    accentClass: string;
    icon: string;
  }>> {
    const platforms = await this.getPlatforms();
    return platforms.reduce((map, p) => {
      // Use a default color if not set
      const color = p.color || '#6b7280';
      const icon = p.icon || 'Video';

      // For now, use simple theme generation - can be enhanced later
      map[p.platformId] = {
        backgroundClass: 'bg-gray-50 dark:bg-gray-900/20',
        borderClass: 'border-gray-200 dark:border-gray-800',
        accentClass: 'text-gray-600 dark:text-gray-400',
        icon: icon.toLowerCase(),
      };
      return map;
    }, {} as Record<string, any>);
  }

  /**
   * Clear the platform cache (useful for testing or forced refresh)
   */
  static clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
  }
}