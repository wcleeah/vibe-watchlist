'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { EditableMediaCard } from '@/components/shared/editable-media-card'
import type { VideoFormData } from '@/types/form'

export function FormPreview() {
    const { watch, setValue } = useFormContext<VideoFormData>()
    const [isEditing, setIsEditing] = useState(false)

    const title = watch('title') || ''
    const thumbnailUrl = watch('thumbnailUrl')
    const url = watch('url') || ''
    const platform = watch('platform') || 'unknown'
    const tagStrs = watch('tagStrs') || []

    return (
        <EditableMediaCard
            title={title}
            thumbnailUrl={thumbnailUrl || null}
            url={url}
            metadata={[{ key: 'PLATFORM', value: platform, color: 'green' }]}
            tags={tagStrs.map((name, i) => ({ id: i, name }))}
            isEditing={isEditing}
            onTitleChange={(t) => setValue('title', t)}
            onThumbnailUrlChange={(u) => setValue('thumbnailUrl', u)}
            onEditToggle={() => setIsEditing(!isEditing)}
        />
    )
}
