'use client'

import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import type { VideoFormData } from '@/types/form'
import { VideoCard } from '../videos/video-card'

export function PreviewCard() {
    const { setValue, watch } = useFormContext<VideoFormData>()
    const [isEditing, setIsEditing] = useState(false)

    const url = watch('url')
    const title = watch('title')
    const platform = watch('platform')
    const thumbnailUrl = watch('thumbnailUrl')
    const tags = watch('tagStrs') || []

    return (
        <div className='relative'>
            {/* Edit toggle button - only show when not in edit mode */}
            {!isEditing && (
                <div className='absolute top-2 right-2 z-10'>
                    <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => setIsEditing(true)}
                        className='h-8 px-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm'
                    >
                        <Pencil className='w-3 h-3 mr-1' />
                        Edit
                    </Button>
                </div>
            )}
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
                editable={isEditing}
                onThumbnailUrlChange={(url: string) =>
                    setValue('thumbnailUrl', url)
                }
                onTitleChange={(title: string) => setValue('title', title)}
                onToggleManual={() => setIsEditing(false)}
            />
        </div>
    )
}
