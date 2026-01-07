import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import type { PlatformConfig } from '@/lib/db/schema'
import { platformConfigs } from '@/lib/db/schema'

/**
 * Server-side platform data access service
 * Handles direct database operations for platform configurations
 */
export class PlatformDataService {
    /**
     * Get all enabled platforms from database
     */
    static async getPlatforms(): Promise<PlatformConfig[]> {
        try {
            const platforms = await db
                .select()
                .from(platformConfigs)
                .where(eq(platformConfigs.enabled, true))
                .orderBy(platformConfigs.displayName)

            return platforms
        } catch (error) {
            console.error('PlatformDataService.getPlatforms error:', error)
            return []
        }
    }

    /**
     * Get platform filters for UI consumption
     */
    static async getPlatformFilters(): Promise<
        Array<{
            key: string
            label: string
            icon: string
            color: string
        }>
    > {
        try {
            const platforms = await PlatformDataService.getPlatforms()

            return platforms.map((platform) => ({
                key: platform.platformId,
                label: platform.displayName,
                icon: platform.icon || 'Video',
                color: platform.color || '#6b7280',
            }))
        } catch (error) {
            console.error(
                'PlatformDataService.getPlatformFilters error:',
                error,
            )
            return []
        }
    }

    /**
     * Get platform by ID
     */
    static async getPlatformById(
        platformId: string,
    ): Promise<PlatformConfig | null> {
        try {
            const platforms = await db
                .select()
                .from(platformConfigs)
                .where(eq(platformConfigs.platformId, platformId))
                .limit(1)

            return platforms[0] || null
        } catch (error) {
            console.error('PlatformDataService.getPlatformById error:', error)
            return null
        }
    }

    /**
     * Get all platforms (including disabled ones) for admin purposes
     */
    static async getAllPlatforms(): Promise<PlatformConfig[]> {
        try {
            const platforms = await db
                .select()
                .from(platformConfigs)
                .orderBy(platformConfigs.displayName)

            return platforms
        } catch (error) {
            console.error('PlatformDataService.getAllPlatforms error:', error)
            return []
        }
    }
}
