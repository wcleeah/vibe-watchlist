import { eq, inArray } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { playlists, videos } from '@/lib/db/schema'
import { YouTubeApiService } from '@/lib/services/youtube-api-service'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/playlists/[id]/sync - Re-sync playlist from YouTube
export async function POST(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const playlistId = parseInt(id, 10)

        if (Number.isNaN(playlistId)) {
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

        // Fetch latest items from YouTube
        const youtubeItems = await YouTubeApiService.getPlaylistItems(
            playlist.youtubePlaylistId,
        )

        // Get current videos in database
        const currentVideos = await db
            .select()
            .from(videos)
            .where(eq(videos.playlistId, playlistId))

        // Create maps for comparison
        const currentVideoMap = new Map(
            currentVideos.map((v) => [v.youtubeVideoId, v]),
        )
        const youtubeVideoMap = new Map(
            youtubeItems.map((item) => [item.videoId, item]),
        )

        // Find videos to add (in YouTube but not in DB)
        const videosToAdd = youtubeItems.filter(
            (item) => !currentVideoMap.has(item.videoId),
        )

        // Find videos to remove (in DB but not in YouTube)
        const videosToRemove = currentVideos.filter(
            (v) => v.youtubeVideoId && !youtubeVideoMap.has(v.youtubeVideoId),
        )

        // Find videos to update position (if position changed)
        const videosToUpdate: Array<{ id: number; playlistIndex: number }> = []
        for (const video of currentVideos) {
            if (!video.youtubeVideoId) continue
            const youtubeItem = youtubeVideoMap.get(video.youtubeVideoId)
            if (youtubeItem && youtubeItem.position !== video.playlistIndex) {
                videosToUpdate.push({
                    id: video.id,
                    playlistIndex: youtubeItem.position,
                })
            }
        }

        // Remove videos no longer in playlist (must happen before
        // inserts/updates to avoid potential URL conflicts and stale data)
        if (videosToRemove.length > 0) {
            const idsToRemove = videosToRemove.map((v) => v.id)
            await db.delete(videos).where(inArray(videos.id, idsToRemove))
        }

        // Update positions concurrently (neon-http doesn't support
        // transactions, and CASE queries hit the 32-param limit)
        if (videosToUpdate.length > 0) {
            const now = new Date()
            await Promise.all(
                videosToUpdate.map((update) =>
                    db
                        .update(videos)
                        .set({
                            playlistIndex: update.playlistIndex,
                            updatedAt: now,
                        })
                        .where(eq(videos.id, update.id)),
                ),
            )
        }

        // Add new videos (after removes/updates to avoid URL conflicts)
        if (videosToAdd.length > 0) {
            const videoValues = videosToAdd.map((item) => ({
                url: `https://www.youtube.com/watch?v=${item.videoId}`,
                title: item.title,
                platform: 'youtube',
                thumbnailUrl: item.thumbnailUrl || null,
                isWatched: false,
                playlistId: playlistId,
                playlistIndex: item.position,
                youtubeVideoId: item.videoId,
            }))

            await db.insert(videos).values(videoValues)
        }

        // Update playlist sync bookkeeping (preserve existing metadata)
        await db
            .update(playlists)
            .set({
                itemCount: youtubeItems.length,
                lastSyncedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(playlists.id, playlistId))

        // Get updated stats
        const updatedVideos = await db
            .select()
            .from(videos)
            .where(eq(videos.playlistId, playlistId))

        const watchedCount = updatedVideos.filter((v) => v.isWatched).length
        const unwatchedCount = updatedVideos.length - watchedCount

        return NextResponse.json({
            success: true,
            sync: {
                added: videosToAdd.length,
                removed: videosToRemove.length,
                unchanged:
                    youtubeItems.length -
                    videosToAdd.length -
                    videosToUpdate.length,
                positionsUpdated: videosToUpdate.length,
            },
            playlist: {
                id: playlistId,
                youtubePlaylistId: playlist.youtubePlaylistId,
                title: playlist.title,
                thumbnailUrl: playlist.thumbnailUrl,
                channelTitle: playlist.channelTitle,
                itemCount: youtubeItems.length,
                watchedCount,
                unwatchedCount,
                lastSyncedAt: new Date(),
            },
        })
    } catch (error) {
        console.error('Error syncing playlist:', error)
        const message =
            error instanceof Error ? error.message : 'Failed to sync playlist'
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 },
        )
    }
}
