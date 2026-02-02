import type { PlatformConfig as DBPlatformConfig } from '@/lib/db/schema'

/**
 * Full platform configuration from database.
 * Re-exported from schema for convenience.
 */
export type PlatformConfig = DBPlatformConfig

/**
 * Data required to create a new platform.
 */
export interface NewPlatformData {
    platformId: string
    name: string
    displayName: string
    patterns: string[]
    extractor?: string
    color?: string
    icon?: string
    confidenceScore?: number
}

/**
 * Data for updating an existing platform.
 * All fields optional except platformId is used as identifier.
 */
export interface UpdatePlatformData {
    name?: string
    displayName?: string
    patterns?: string[]
    extractor?: string
    color?: string
    icon?: string
    enabled?: boolean
    confidenceScore?: number
}
