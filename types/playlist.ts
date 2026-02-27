import type { Playlist as DbPlaylist, Tag, Video } from '@/lib/db/schema'

// Re-export base type from schema
export type { Playlist as DbPlaylist } from '@/lib/db/schema'

// Playlist with computed progress fields
export interface Playlist extends DbPlaylist {
    watchedCount?: number
    unwatchedCount?: number
    tags?: Tag[]
}

// Playlist with all associated videos
export interface PlaylistWithVideos extends Playlist {
    videos: PlaylistVideo[]
    watchedCount: number
    unwatchedCount: number
    tags: Tag[]
}

// Playlist summary for list views
export interface PlaylistSummary {
    id: number
    youtubePlaylistId: string
    title: string | null
    thumbnailUrl: string | null
    channelTitle: string | null
    platform: string
    itemCount: number
    watchedCount: number
    unwatchedCount: number
    cascadeWatched: boolean
    autoComplete: boolean
    sortOrder: number
    lastSyncedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    tags: Array<{ id: number; name: string; color: string | null }>
}

// Video within a playlist context
export interface PlaylistVideo extends Video {
    playlistIndex: number
    youtubeVideoId: string | null
    tags?: Tag[]
}

// API request types
export interface CreatePlaylistRequest {
    url: string // YouTube playlist URL
}

export interface SyncPlaylistResponse {
    added: number
    removed: number
    unchanged: number
    playlist: PlaylistSummary
}

// API response types
export interface PlaylistApiResponse {
    success: boolean
    playlist?: PlaylistWithVideos
    error?: string
}

export interface PlaylistListApiResponse {
    success: boolean
    playlists?: PlaylistSummary[]
    error?: string
}

// Filter types for listing playlists
export interface PlaylistFilters {
    status?: 'all' | 'has-unwatched' | 'completed'
    search?: string
    isCompleted?: boolean
    platform?: string
    tagIds?: number[]
    channelTitle?: string
    sortBy?: 'custom' | 'progress' | 'createdAt' | 'title'
}

// Playlist import preview (before confirming import)
export interface PlaylistImportPreview {
    playlistId: string
    title: string
    description: string
    thumbnailUrl: string
    channelTitle: string
    itemCount: number
}
