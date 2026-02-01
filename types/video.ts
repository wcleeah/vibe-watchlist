import type { VideoPlatform } from '@/lib/utils/url-parser'
import type { Tag } from './tag'

export interface Video {
    id: number
    url: string
    title: string | null
    platform: VideoPlatform
    thumbnailUrl: string | null
    isWatched: boolean | null
    // Playlist-related fields
    playlistId: number | null
    playlistIndex: number | null
    youtubeVideoId: string | null
    sortOrder: number
    createdAt: Date | null
    updatedAt: Date | null
}

export interface VideoWithTags extends Video {
    tags?: Tag[]
    highlightedTitle?: string
    highlightedTags?: Tag[]
}

export interface VideoMetadata {
    title: string
    thumbnailUrl: string | null
    authorName?: string
    authorUrl?: string
}

export interface ParsedUrl {
    url: string
    platform: VideoPlatform
    videoId?: string
    playlistId?: string
    isPlaylist: boolean
    isValid: boolean
}

// Filter types for listing videos
export interface VideoFilters {
    isWatched?: boolean
    search?: string
    platforms?: string[]
    tagIds?: number[]
    sortBy?: 'createdAt' | 'updatedAt' | 'title'
    sortOrder?: 'asc' | 'desc'
}
