'use client'

import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { VideoFormData } from '@/types/form'
import type { PlaylistImportPreview } from '@/types/playlist'

interface PlaylistFormProps {
    onReset: () => void
    onImported?: () => void
}

export function PlaylistForm({ onReset, onImported }: PlaylistFormProps) {
    const { getValues, watch } = useFormContext<VideoFormData>()
    const url = watch('url')

    const [playlistPreview, setPlaylistPreview] =
        useState<PlaylistImportPreview | null>(null)
    const [isLoadingPreview, setIsLoadingPreview] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Auto-fetch preview when URL changes
    useEffect(() => {
        if (!url || playlistPreview || isLoadingPreview) return

        setError(null)
        setIsLoadingPreview(true)

        fetch('/api/playlists/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch playlist info')
                }
                return response.json()
            })
            .then((data) => setPlaylistPreview(data.preview))
            .catch((err) =>
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to fetch playlist',
                ),
            )
            .finally(() => setIsLoadingPreview(false))
    }, [url, playlistPreview, isLoadingPreview])

    const handleImport = async () => {
        if (!url) {
            setError('Please enter a playlist URL')
            return
        }

        setError(null)
        setIsImporting(true)

        try {
            const response = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to import playlist')
            }

            toast.success('Playlist imported successfully!')
            onImported?.()
            onReset()
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to import playlist',
            )
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <div className='space-y-6'>
            {/* Playlist Preview */}
            <div className='space-y-4'>
                {playlistPreview ? (
                    <div className='p-4 bg-muted/50 rounded-lg space-y-4'>
                        <h3 className='font-medium'>Playlist Preview</h3>
                        <div className='flex gap-4'>
                            {playlistPreview.thumbnailUrl && (
                                <img
                                    src={playlistPreview.thumbnailUrl}
                                    alt={playlistPreview.title}
                                    className='w-32 h-20 object-cover rounded'
                                />
                            )}
                            <div className='flex-1 min-w-0'>
                                <p className='font-semibold truncate'>
                                    {playlistPreview.title}
                                </p>
                                <p className='text-sm text-muted-foreground'>
                                    {playlistPreview.channelTitle}
                                </p>
                                <p className='text-sm text-muted-foreground'>
                                    {playlistPreview.itemCount} videos
                                </p>
                            </div>
                        </div>
                        {playlistPreview.description && (
                            <p className='text-sm text-muted-foreground line-clamp-2'>
                                {playlistPreview.description}
                            </p>
                        )}
                    </div>
                ) : isLoadingPreview ? (
                    <div className='p-4 bg-muted/50 rounded-lg text-center'>
                        <p className='text-sm text-muted-foreground'>
                            Loading playlist info...
                        </p>
                    </div>
                ) : (
                    <div className='p-4 bg-muted/50 rounded-lg'>
                        <p className='text-sm text-muted-foreground text-center'>
                            Enter a YouTube playlist URL to see preview before
                            importing.
                        </p>
                    </div>
                )}
            </div>

            <div className='flex gap-2'>
                <Button
                    type='button'
                    variant='secondary'
                    className='flex-1 h-12'
                    onClick={onReset}
                    disabled={isLoadingPreview || isImporting}
                >
                    Reset
                </Button>
                {playlistPreview ? (
                    <Button
                        type='button'
                        onClick={handleImport}
                        disabled={isImporting}
                        className='flex-1 h-12'
                    >
                        {isImporting
                            ? 'Importing...'
                            : `Import ${playlistPreview.itemCount} Videos`}
                    </Button>
                ) : (
                    <Button
                        type='button'
                        disabled={true}
                        className='flex-1 h-12'
                    >
                        {isLoadingPreview ? 'Loading...' : 'Preview Playlist'}
                    </Button>
                )}
            </div>

            {error && (
                <p className='text-sm text-destructive text-center'>{error}</p>
            )}
        </div>
    )
}
