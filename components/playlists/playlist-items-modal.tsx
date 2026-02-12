'use client'

import { Check, ExternalLink, Globe, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

import { RefreshMetadataModal } from '@/components/video-form/refresh-metadata-modal'
import type {
    PlaylistSummary,
    PlaylistVideo,
    PlaylistWithVideos,
} from '@/types/playlist'

interface PlaylistItemsModalProps {
    playlist: PlaylistSummary | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onRefresh?: () => void
}

export function PlaylistItemsModal({
    playlist,
    open,
    onOpenChange,
    onRefresh,
}: PlaylistItemsModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [playlistData, setPlaylistData] = useState<PlaylistWithVideos | null>(
        null,
    )
    const [watchingVideoId, setWatchingVideoId] = useState<number | null>(null)
    const [refreshVideo, setRefreshVideo] = useState<PlaylistVideo | null>(null)
    const [refreshModalOpen, setRefreshModalOpen] = useState(false)

    const fetchPlaylistDetails = useCallback(async () => {
        if (!playlist?.id) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/playlists/${playlist.id}`)
            if (!response.ok) {
                throw new Error('Failed to fetch playlist details')
            }
            const data = await response.json()
            setPlaylistData(data.playlist)
        } catch (error) {
            console.error('Error fetching playlist:', error)
            toast.error('Failed to load playlist items')
        } finally {
            setIsLoading(false)
        }
    }, [playlist?.id])

    useEffect(() => {
        if (open && playlist?.id) {
            fetchPlaylistDetails()
        }
    }, [open, playlist?.id, fetchPlaylistDetails])

    const handleMarkWatched = async (video: PlaylistVideo) => {
        if (!playlistData || !video.id) return

        setWatchingVideoId(video.id)
        try {
            const response = await fetch(
                `/api/playlists/${playlistData.id}/videos/${video.id}/watched`,
                { method: 'POST' },
            )

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to mark as watched')
            }

            // Refresh playlist data
            await fetchPlaylistDetails()
            onRefresh?.()
            toast.success(
                `Marked videos 1-${video.playlistIndex + 1} as watched`,
            )
        } catch (error) {
            console.error('Error marking watched:', error)
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to mark as watched',
            )
        } finally {
            setWatchingVideoId(null)
        }
    }

    const handleUnmarkWatched = async (video: PlaylistVideo) => {
        if (!playlistData || !video.id) return

        setWatchingVideoId(video.id)
        try {
            const response = await fetch(
                `/api/playlists/${playlistData.id}/videos/${video.id}/watched`,
                { method: 'DELETE' },
            )

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to unmark as watched')
            }

            // Refresh playlist data
            await fetchPlaylistDetails()
            onRefresh?.()
            toast.success('Unmarked video as watched')
        } catch (error) {
            console.error('Error unmarking watched:', error)
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to unmark as watched',
            )
        } finally {
            setWatchingVideoId(null)
        }
    }

    const handleRefreshMetadata = (video: PlaylistVideo) => {
        setRefreshVideo(video)
        setRefreshModalOpen(true)
    }

    const handleUpdateMetadata = async (
        title: string,
        thumbnailUrl: string | null,
    ) => {
        if (!refreshVideo?.id) return

        try {
            const response = await fetch(`/api/videos/${refreshVideo.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    thumbnailUrl,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to update video')
            }

            // Refresh playlist data
            await fetchPlaylistDetails()
            onRefresh?.()
            toast.success('Video metadata updated')
        } catch (error) {
            console.error('Error updating video:', error)
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to update video',
            )
            throw error
        }
    }

    const buildWatchUrl = (video: PlaylistVideo) => {
        if (!playlistData || !video.youtubeVideoId) return video.url

        const url = new URL('https://www.youtube.com/watch')
        url.searchParams.set('v', video.youtubeVideoId)
        url.searchParams.set('list', playlistData.youtubePlaylistId)
        url.searchParams.set('index', String(video.playlistIndex + 1))
        return url.toString()
    }

    const progress =
        playlistData && (playlistData.itemCount ?? 0) > 0
            ? Math.round(
                  (playlistData.watchedCount / (playlistData.itemCount ?? 1)) *
                      100,
              )
            : 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col'>
                <DialogHeader>
                    <DialogTitle className='font-mono'>
                        {playlist?.title || 'Playlist Items'}
                    </DialogTitle>
                    {playlistData && (
                        <div className='mt-2'>
                            <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                                <div
                                    className='bg-green-500 h-2 rounded-full transition-all duration-300'
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                                {playlistData.watchedCount} /{' '}
                                {playlistData.itemCount} videos watched (
                                {progress}%)
                            </p>
                        </div>
                    )}
                </DialogHeader>

                <div className='flex-1 overflow-y-auto mt-4'>
                    {isLoading ? (
                        <div className='flex items-center justify-center py-12'>
                            <Loader2 className='w-8 h-8 animate-spin text-gray-500' />
                        </div>
                    ) : playlistData?.videos?.length === 0 ? (
                        <div className='text-center py-12 text-gray-500'>
                            No videos in this playlist
                        </div>
                    ) : (
                        <div className='space-y-2'>
                            {playlistData?.videos?.map((video) => (
                                <PlaylistItemRow
                                    key={video.id}
                                    video={video}
                                    watchUrl={buildWatchUrl(video)}
                                    isLoading={watchingVideoId === video.id}
                                    onMarkWatched={() =>
                                        handleMarkWatched(video)
                                    }
                                    onUnmarkWatched={() =>
                                        handleUnmarkWatched(video)
                                    }
                                    onRefreshMetadata={() =>
                                        handleRefreshMetadata(video)
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
            <RefreshMetadataModal
                video={refreshVideo}
                open={refreshModalOpen}
                onOpenChange={setRefreshModalOpen}
                onUpdate={handleUpdateMetadata}
            />
        </Dialog>
    )
}

interface PlaylistItemRowProps {
    video: PlaylistVideo
    watchUrl: string
    isLoading: boolean
    onMarkWatched: () => void
    onUnmarkWatched: () => void
    onRefreshMetadata?: () => void
}

function PlaylistItemRow({
    video,
    watchUrl,
    isLoading,
    onMarkWatched,
    onUnmarkWatched,
    onRefreshMetadata,
}: PlaylistItemRowProps) {
    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                video.isWatched
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
            }`}
        >
            {/* Index */}
            <div className='w-8 text-center font-mono text-sm text-gray-500 dark:text-gray-400 flex-shrink-0'>
                {video.playlistIndex + 1}
            </div>

            {/* Thumbnail */}
            <div className='w-24 h-14 flex-shrink-0 relative rounded overflow-hidden bg-gray-100 dark:bg-gray-800'>
                {video.thumbnailUrl ? (
                    <Image
                        src={video.thumbnailUrl}
                        alt={video.title || 'Video thumbnail'}
                        fill
                        className='object-cover'
                    />
                ) : (
                    <div className='w-full h-full flex items-center justify-center text-gray-400'>
                        <span className='text-xs'>No img</span>
                    </div>
                )}
            </div>

            {/* Title */}
            <div className='flex-1 min-w-0'>
                <p
                    className={`text-sm font-medium line-clamp-2 ${
                        video.isWatched
                            ? 'text-gray-500 dark:text-gray-400'
                            : 'text-gray-900 dark:text-gray-100'
                    }`}
                    title={video.title || 'Untitled'}
                >
                    {video.title || 'Untitled'}
                </p>
            </div>

            {/* Watched indicator */}
            {video.isWatched && (
                <div className='flex-shrink-0'>
                    <Check className='w-5 h-5 text-green-500' />
                </div>
            )}

            {/* Actions */}
            <div className='flex gap-2 flex-shrink-0'>
                <a
                    href={watchUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex items-center gap-1'
                    title='Watch on YouTube'
                >
                    <ExternalLink className='w-3 h-3' />
                    watch()
                </a>
                {video.isWatched ? (
                    <button
                        type='button'
                        onClick={onUnmarkWatched}
                        disabled={isLoading}
                        className='px-3 py-1.5 text-xs bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 rounded transition-colors flex items-center gap-1'
                        title='Mark as unwatched'
                    >
                        {isLoading ? (
                            <Loader2 className='w-3 h-3 animate-spin' />
                        ) : (
                            'unWatch()'
                        )}
                    </button>
                ) : (
                    <button
                        type='button'
                        onClick={onMarkWatched}
                        disabled={isLoading}
                        className='px-3 py-1.5 text-xs bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 rounded transition-colors flex items-center gap-1'
                        title='Mark watched up to this video'
                    >
                        {isLoading ? (
                            <Loader2 className='w-3 h-3 animate-spin' />
                        ) : (
                            'markWatched()'
                        )}
                    </button>
                )}
                {onRefreshMetadata && video.platform === 'youtube' && (
                    <button
                        type='button'
                        onClick={onRefreshMetadata}
                        className='px-2 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors'
                        title='Refresh metadata'
                    >
                        <Globe className='w-3 h-3' />
                    </button>
                )}
            </div>
        </div>
    )
}
