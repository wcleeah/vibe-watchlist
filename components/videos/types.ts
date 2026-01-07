import type { Tag } from '@/types/tag'
import type { VideoMetadata } from '@/types/video'

export interface VideoData {
    id?: number
    url: string
    title: string | null
    platform: string
    thumbnailUrl: string | null | undefined
    isWatched: boolean | null
    createdAt?: Date | null
    updatedAt?: Date | null
    tags?: Tag[]
    highlightedTitle?: string
    highlightedTags?: Tag[]
    metadata?: VideoMetadata | null
    error?: string | null
}

export interface PreviewCardProps {
    video: VideoData
    showActions?: boolean
    onMarkWatched?: (id: number) => Promise<void>
    onDelete?: (id: number) => Promise<void>
    onTitleChange?: (title: string) => void
    onThumbnailUrlChange?: (url: string) => void
    className?: string
    showBackground?: boolean
    editable?: boolean
}

export interface LoadingSkeletonProps {
    className?: string
}

export interface ErrorDisplayProps {
    error: string
    onRetry?: () => void
    onToggleManual?: () => void
    className?: string
}
