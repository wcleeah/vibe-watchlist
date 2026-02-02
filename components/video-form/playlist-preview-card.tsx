'use client'

import type { PlaylistImportPreview } from '@/types/playlist'

interface PlaylistPreviewCardProps {
    preview: PlaylistImportPreview | null
}

/**
 * Displays a preview of a playlist before import
 */
export function PlaylistPreviewCard({ preview }: PlaylistPreviewCardProps) {
    if (preview) {
        return (
            <div className='p-4 bg-muted/50 rounded-lg space-y-4'>
                <h3 className='font-medium'>Playlist Preview</h3>
                <div className='flex gap-4'>
                    {preview.thumbnailUrl && (
                        <img
                            src={preview.thumbnailUrl}
                            alt={preview.title}
                            className='w-32 h-20 object-cover rounded'
                        />
                    )}
                    <div className='flex-1 min-w-0'>
                        <p className='font-semibold truncate'>
                            {preview.title}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                            {preview.channelTitle}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                            {preview.itemCount} videos
                        </p>
                    </div>
                </div>
                {preview.description && (
                    <p className='text-sm text-muted-foreground line-clamp-2'>
                        {preview.description}
                    </p>
                )}
            </div>
        )
    }

    return (
        <div className='p-4 bg-muted/50 rounded-lg'>
            <p className='text-sm text-muted-foreground text-center'>
                Enter a YouTube playlist URL above and click &quot;Preview&quot;
                to see playlist details before importing.
            </p>
        </div>
    )
}
