import type { VideoPlatform } from '@/lib/utils/url-parser'
import type { Tag } from './tag'

export interface ComingSoon {
    id: number
    url: string
    title: string | null
    platform: VideoPlatform
    thumbnailUrl: string | null
    releaseDate: string // ISO date string
    transformedAt: string | null // ISO date string, null = not transformed
    sortOrder: number
    createdAt: Date | null
    updatedAt: Date | null
}

export interface ComingSoonWithTags extends ComingSoon {
    tags?: Tag[]
    highlightedTitle?: string
    highlightedTags?: Tag[]
    isReleased?: boolean
}

export interface ComingSoonFilters {
    transformed?: boolean
    search?: string
    platforms?: string[]
    tagIds?: number[]
    sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'releaseDate'
    sortOrder?: 'asc' | 'desc'
}
