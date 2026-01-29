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
