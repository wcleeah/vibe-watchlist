import { asc, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { playlists, tags, videos, videoTags } from '@/lib/db/schema'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/playlists/[id] - Get single playlist with all videos
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const playlistId = parseInt(id, 10)

        if (isNaN(playlistId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid playlist ID' },
                { status: 400 },
            )
        }

        // Get playlist
        const [playlist] = await db
            .select()
            .from(playlists)
            .where(eq(playlists.id, playlistId))
            .limit(1)

        if (!playlist) {
            return NextResponse.json(
                { success: false, error: 'Playlist not found' },
                { status: 404 },
            )
        }

        // Get all videos in the playlist with tags
        const playlistVideos = await db
            .select({
                id: videos.id,
                url: videos.url,
                title: videos.title,
                platform: videos.platform,
                thumbnailUrl: videos.thumbnailUrl,
                isWatched: videos.isWatched,
                playlistId: videos.playlistId,
                playlistIndex: videos.playlistIndex,
                youtubeVideoId: videos.youtubeVideoId,
                createdAt: videos.createdAt,
                updatedAt: videos.updatedAt,
            })
            .from(videos)
            .where(eq(videos.playlistId, playlistId))
            .orderBy(asc(videos.playlistIndex))

        // Get tags for each video
        const videosWithTags = await Promise.all(
            playlistVideos.map(async (video) => {
                const videoTagResults = await db
                    .select({
                        id: tags.id,
                        name: tags.name,
                        color: tags.color,
                    })
                    .from(videoTags)
                    .innerJoin(tags, eq(videoTags.tagId, tags.id))
                    .where(eq(videoTags.videoId, video.id))

                return {
                    ...video,
                    tags: videoTagResults,
                }
            }),
        )

        // Calculate stats
        const watchedCount = videosWithTags.filter((v) => v.isWatched).length
        const unwatchedCount = videosWithTags.length - watchedCount

        return NextResponse.json({
            success: true,
            playlist: {
                ...playlist,
                videos: videosWithTags,
                watchedCount,
                unwatchedCount,
            },
        })
    } catch (error) {
        console.error('Error fetching playlist:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch playlist' },
            { status: 500 },
        )
    }
}

// DELETE /api/playlists/[id] - Delete playlist and all its videos
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const playlistId = parseInt(id, 10)

        if (isNaN(playlistId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid playlist ID' },
                { status: 400 },
            )
        }

        // Check if playlist exists
        const [playlist] = await db
            .select()
            .from(playlists)
            .where(eq(playlists.id, playlistId))
            .limit(1)

        if (!playlist) {
            return NextResponse.json(
                { success: false, error: 'Playlist not found' },
                { status: 404 },
            )
        }

        // Delete playlist (videos will be cascade deleted due to FK constraint)
        await db.delete(playlists).where(eq(playlists.id, playlistId))

        return NextResponse.json({
            success: true,
            message: 'Playlist and all its videos deleted successfully',
        })
    } catch (error) {
        console.error('Error deleting playlist:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete playlist' },
            { status: 500 },
        )
    }
}
