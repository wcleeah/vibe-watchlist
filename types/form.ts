import { z } from 'zod'
import type { PlatformSuggestion } from '@/lib/services/ai-service'
import type { MetadataSuggestion } from '@/lib/types/ai-metadata'
import type { Tag } from './tag'
import type { ParsedUrl, VideoMetadata } from './video'

export interface VideoFormState {
    url: string
    parsedUrl: ParsedUrl | null
    metadata: VideoMetadata | null
    isLoadingMetadata: boolean
    previewError: string | null
    selectedTags: Tag[]
    availableTags: Tag[]
    tagInput: string
    showTagSuggestions: boolean
    filteredSuggestions: Tag[]
    isLoadingTags: boolean
    tagError: string | null
    isAdding: boolean
}

export interface VideoFormActions {
    setUrl: (url: string) => void
    setTagInput: (value: string) => void
    handleAddVideo: () => Promise<void>
    handleTagInputChange: (value: string) => void
    handleTagKeyDown: (e: React.KeyboardEvent) => Promise<void>
    removeTag: (tagId: number) => void
    selectSuggestedTag: (tag: Tag) => void
}

export interface VideoFormOptions {
    onVideoAdded?: () => void
    autoPreview?: boolean
}

// Video addition form schema and types
export const videoSchema = z.object({
    url: z.string(),
    title: z.string().min(1, 'Title is required'),
    thumbnailUrl: z.string().optional(),
    platform: z.string(),
    tags: z.array(z.number()).min(1).optional(),
    tagStrs: z.array(z.string()).min(1).optional(),
})

export type VideoFormData = z.infer<typeof videoSchema>

// Unified suggestions for video addition
export interface VideoSuggestions {
    ai: MetadataSuggestion[]
    platform: PlatformSuggestion[]
}
