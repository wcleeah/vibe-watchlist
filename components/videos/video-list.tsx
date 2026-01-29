import type { Video } from '@/lib/db/schema'
import type { Tag } from '@/types/tag'
import { VideoCard } from './video-card'

interface VideoWithTags extends Video {
    tags?: Tag[]
    highlightedTitle?: string
    highlightedTags?: Tag[]
}

interface VideoListProps {
    videos: VideoWithTags[]
    onMarkWatched?: (id: number) => Promise<void>
    onDelete?: (id: number) => Promise<void>
    onEdit?: (video: VideoWithTags) => void
    onConvertToSeries?: (video: VideoWithTags) => void
    onConvertToPlaylist?: (video: VideoWithTags) => void
    playlistUrlVideoIds?: Set<number>
}

export function VideoList({
    videos,
    onMarkWatched,
    onDelete,
    onEdit,
    onConvertToSeries,
    onConvertToPlaylist,
    playlistUrlVideoIds,
}: VideoListProps) {
    if (videos.length === 0) {
        return (
            <div className='text-center py-12'>
                <div className='w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center'>
                    <svg
                        className='w-6 h-6 text-gray-400'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                        aria-hidden='true'
                    >
                        <title>Video icon</title>
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={1.5}
                            d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                        />
                    </svg>
                </div>
                <h3 className='text-base font-medium mb-1 font-mono'>
                    No videos found
                </h3>
                <p className='text-sm text-gray-500 dark:text-gray-400 font-mono'>
                    {'//'} Add your first video above to get started
                </p>
            </div>
        )
    }

    return (
        <div className='overflow-hidden'>
            {videos.map((video) => {
                const isPlaylistUrl =
                    playlistUrlVideoIds?.has(video.id) ?? false
                return (
                    <div key={video.id} className='py-3'>
                        <VideoCard
                            video={video}
                            showActions={true}
                            onMarkWatched={onMarkWatched}
                            onDelete={onDelete}
                            onEdit={onEdit ? () => onEdit(video) : undefined}
                            onConvertToSeries={
                                onConvertToSeries
                                    ? () => onConvertToSeries(video)
                                    : undefined
                            }
                            onConvertToPlaylist={
                                onConvertToPlaylist
                                    ? () => onConvertToPlaylist(video)
                                    : undefined
                            }
                            isPlaylistUrl={isPlaylistUrl}
                        />
                    </div>
                )
            })}
        </div>
    )
}
