'use client'

import { useFormContext } from 'react-hook-form'
import type { VideoFormData } from '@/types/form'
import { VideoCard } from '../videos/video-card'

export function PreviewCard() {
    const { setValue, watch } = useFormContext<VideoFormData>()

    const url = watch('url')
    const title = watch('title')
    const platform = watch('platform')
    const thumbnailUrl = watch('thumbnailUrl')
    const tags = watch('tagStrs') || []

    return (
        <VideoCard
            video={{
                url,
                title,
                platform,
                thumbnailUrl,
                isWatched: false,
                tags: tags.map((t) => {
                    return {
                        id: 0,
                        name: t,
                    }
                }),
            }}
            showBackground={false}
            editable={true}
            onThumbnailUrlChange={(url: string) =>
                setValue('thumbnailUrl', url)
            }
            onTitleChange={(url: string) => setValue('title', url)}
        />
    )
}
