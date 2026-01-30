import type { VideoFormData } from '@/types/form'
import type { Tag } from '@/types/tag'
import type { VideoWithTags } from '@/types/video'

/**
 * Convert form data to a video preview object
 */
export function formDataToVideoPreview(
    form: VideoFormData,
    availableTags: Tag[],
): {
    id: number
    url: string
    title: string
    platform: string
    thumbnailUrl: string | null
    isWatched: boolean
    tags: Tag[]
} {
    const selectedTags =
        form.tags
            ?.map((tagId: number) =>
                availableTags.find((t: Tag) => t.id === tagId),
            )
            .filter((tag: Tag | undefined): tag is Tag => tag !== undefined) ||
        []

    return {
        id: 0,
        url: form.url,
        title: form.title,
        platform: form.platform,
        thumbnailUrl: form.thumbnailUrl || null,
        isWatched: false,
        tags: selectedTags,
    }
}

/**
 * Convert video data to form data
 */
export function videoToFormData(video: VideoWithTags): VideoFormData {
    return {
        url: video.url,
        title: video.title || '',
        platform: video.platform,
        thumbnailUrl: video.thumbnailUrl || undefined,
        tags: video.tags?.map((t: Tag) => t.id),
        tagStrs: video.tags?.map((t: Tag) => t.name),
    }
}
