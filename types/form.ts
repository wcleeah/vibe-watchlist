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
