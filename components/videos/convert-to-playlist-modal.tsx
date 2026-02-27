'use client'

import { ListMusic, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import type { VideoData } from './types'

interface PlaylistPreview {
    playlistId: string
    title: string
    description: string | null
    thumbnailUrl: string | null
    channelTitle: string | null
    itemCount: number
}

interface ConvertToPlaylistModalProps {
    video: VideoData | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function ConvertToPlaylistModal({
    video,
    open,
    onOpenChange,
    onSuccess,
}: ConvertToPlaylistModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [preview, setPreview] = useState<PlaylistPreview | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [cascadeWatched, setCascadeWatched] = useState(true)
    const [autoComplete, setAutoComplete] = useState(true)

    const fetchPreview = useCallback(async () => {
        if (!video?.url) return

        setIsLoading(true)
        setError(null)
        setPreview(null)

        try {
            const response = await fetch('/api/playlists/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: video.url }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(
                    data.error || 'Failed to fetch playlist preview',
                )
            }

            setPreview(data.preview)
        } catch (err) {
            console.error('Error fetching playlist preview:', err)
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to fetch playlist preview',
            )
        } finally {
            setIsLoading(false)
        }
    }, [video?.url])

    // Fetch playlist preview when modal opens
    useEffect(() => {
        if (open && video?.url) {
            fetchPreview()
        } else if (!open) {
            // Reset state when modal closes
            setPreview(null)
            setError(null)
            setCascadeWatched(true)
            setAutoComplete(true)
        }
    }, [open, video?.url, fetchPreview])

    const handleImport = async () => {
        if (!video?.url) return

        setIsImporting(true)
        try {
            // First, import the playlist
            const importResponse = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: video.url,
                    cascadeWatched,
                    autoComplete,
                }),
            })

            const importData = await importResponse.json()

            if (!importResponse.ok) {
                throw new Error(importData.error || 'Failed to import playlist')
            }

            // Then, delete the original video
            if (video.id) {
                const deleteResponse = await fetch(`/api/videos/${video.id}`, {
                    method: 'DELETE',
                })

                if (!deleteResponse.ok) {
                    console.error(
                        'Failed to delete original video after conversion',
                    )
                    // Don't throw - playlist was imported successfully
                }
            }

            toast.success(
                `Playlist imported with ${preview?.itemCount || 0} videos!`,
            )
            onSuccess()
            onOpenChange(false)
        } catch (err) {
            console.error('Error importing playlist:', err)
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to import playlist',
            )
        } finally {
            setIsImporting(false)
        }
    }

    if (!video) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                        <ListMusic className='w-5 h-5' />
                        Convert to Playlist
                    </DialogTitle>
                    <DialogDescription>
                        Import this YouTube playlist and track each video
                        individually. The original video entry will be removed.
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-4'>
                    {/* Current Video Info */}
                    <div className='p-4 bg-muted/50 rounded-lg space-y-3'>
                        <p className='text-sm font-medium text-muted-foreground'>
                            Current video entry:
                        </p>
                        <div className='flex gap-4'>
                            {video.thumbnailUrl && (
                                <div className='relative w-24 h-14 flex-shrink-0 rounded overflow-hidden'>
                                    <Image
                                        src={video.thumbnailUrl}
                                        alt={video.title || 'Video thumbnail'}
                                        fill
                                        className='object-cover'
                                    />
                                </div>
                            )}
                            <div className='flex-1 min-w-0'>
                                <h4 className='font-medium line-clamp-2 break-words'>
                                    {video.title || 'Untitled Video'}
                                </h4>
                                <p className='text-sm text-muted-foreground'>
                                    {video.platform}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className='flex items-center justify-center py-8'>
                            <Loader2 className='w-6 h-6 animate-spin text-muted-foreground' />
                            <span className='ml-2 text-muted-foreground'>
                                Fetching playlist info...
                            </span>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className='p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
                            <p className='text-sm text-red-700 dark:text-red-400'>
                                {error}
                            </p>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={fetchPreview}
                                className='mt-2'
                            >
                                Try Again
                            </Button>
                        </div>
                    )}

                    {/* Playlist Preview */}
                    {preview && (
                        <div className='p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg space-y-3'>
                            <p className='text-sm font-medium text-indigo-700 dark:text-indigo-300'>
                                Playlist to import:
                            </p>
                            <div className='flex gap-4'>
                                {preview.thumbnailUrl && (
                                    <div className='relative w-24 h-14 flex-shrink-0 rounded overflow-hidden'>
                                        <Image
                                            src={preview.thumbnailUrl}
                                            alt={preview.title}
                                            fill
                                            className='object-cover'
                                        />
                                    </div>
                                )}
                                <div className='flex-1 min-w-0'>
                                    <h4 className='font-medium line-clamp-2 break-words'>
                                        {preview.title}
                                    </h4>
                                    {preview.channelTitle && (
                                        <p className='text-sm text-muted-foreground'>
                                            {preview.channelTitle}
                                        </p>
                                    )}
                                    <p className='text-sm font-medium text-indigo-600 dark:text-indigo-400'>
                                        {preview.itemCount} videos
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Warning */}
                    {preview && (
                        <>
                            <div className='flex items-start space-x-2 p-3 bg-muted/50 rounded-lg'>
                                <input
                                    type='checkbox'
                                    id='convert-cascade-watched'
                                    checked={cascadeWatched}
                                    onChange={(e) =>
                                        setCascadeWatched(e.target.checked)
                                    }
                                    disabled={isImporting}
                                    className='h-4 w-4 rounded border-gray-300 mt-1'
                                />
                                <div className='space-y-1'>
                                    <Label
                                        htmlFor='convert-cascade-watched'
                                        className='cursor-pointer'
                                    >
                                        Mark previous videos as watched
                                    </Label>
                                    <p className='text-xs text-muted-foreground'>
                                        When marking a video as watched, also
                                        mark all earlier videos in the playlist
                                    </p>
                                </div>
                            </div>
                            <div className='flex items-start space-x-2 p-3 bg-muted/50 rounded-lg'>
                                <input
                                    type='checkbox'
                                    id='convert-auto-complete'
                                    checked={autoComplete}
                                    onChange={(e) =>
                                        setAutoComplete(e.target.checked)
                                    }
                                    disabled={isImporting}
                                    className='h-4 w-4 rounded border-gray-300 mt-1'
                                />
                                <div className='space-y-1'>
                                    <Label
                                        htmlFor='convert-auto-complete'
                                        className='cursor-pointer'
                                    >
                                        Auto-mark as completed
                                    </Label>
                                    <p className='text-xs text-muted-foreground'>
                                        Automatically mark playlist as completed
                                        when all videos are watched
                                    </p>
                                </div>
                            </div>
                            <div className='p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg'>
                                <p className='text-sm text-amber-700 dark:text-amber-400'>
                                    The original video entry will be deleted
                                    after conversion. The playlist will be
                                    available on the Playlists page.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className='flex gap-2 justify-end mt-4'>
                    <Button
                        variant='outline'
                        onClick={() => onOpenChange(false)}
                        disabled={isImporting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={isLoading || isImporting || !preview}
                    >
                        {isImporting ? (
                            <>
                                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                                Importing...
                            </>
                        ) : (
                            <>
                                <ListMusic className='w-4 h-4 mr-2' />
                                Import {preview?.itemCount || 0} Videos
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
