import { and, eq, lte } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { playlists, videos } from '@/lib/db/schema'

interface RouteParams {
    params: Promise<{ id: string; videoId: string }>
}

// POST /api/playlists/[id]/videos/[videoId]/watched
// Mark a video as watched and cascade to all earlier videos in the playlist
export async function POST(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id, videoId } = await params
        const playlistId = parseInt(id, 10)
        const targetVideoId = parseInt(videoId, 10)

        if (Number.isNaN(playlistId) || Number.isNaN(targetVideoId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid playlist or video ID' },
                { status: 400 },
            )
        }

        // Get the target video to find its playlist index
        const [targetVideo] = await db
            .select()
            .from(videos)
            .where(
                and(
                    eq(videos.id, targetVideoId),
                    eq(videos.playlistId, playlistId),
                ),
            )
            .limit(1)

        if (!targetVideo) {
            return NextResponse.json(
                { success: false, error: 'Video not found in playlist' },
                { status: 404 },
            )
        }

        if (targetVideo.playlistIndex === null) {
            return NextResponse.json(
                { success: false, error: 'Video has no playlist index' },
                { status: 400 },
            )
        }

        const targetIndex = targetVideo.playlistIndex

        // Check if cascade is enabled for this playlist
        const [playlist] = await db
            .select({ cascadeWatched: playlists.cascadeWatched })
            .from(playlists)
            .where(eq(playlists.id, playlistId))
            .limit(1)

        const shouldCascade = playlist?.cascadeWatched ?? true

        // Mark video(s) as watched based on cascade setting
        const result = shouldCascade
            ? await db
                  .update(videos)
                  .set({ isWatched: true, updatedAt: new Date() })
                  .where(
                      and(
                          eq(videos.playlistId, playlistId),
                          lte(videos.playlistIndex, targetIndex),
                      ),
                  )
                  .returning({ id: videos.id })
            : await db
                  .update(videos)
                  .set({ isWatched: true, updatedAt: new Date() })
                  .where(eq(videos.id, targetVideoId))
                  .returning({ id: videos.id })

        // Get updated playlist stats
        const allPlaylistVideos = await db
            .select()
            .from(videos)
            .where(eq(videos.playlistId, playlistId))

        const watchedCount = allPlaylistVideos.filter((v) => v.isWatched).length
        const unwatchedCount = allPlaylistVideos.length - watchedCount

        return NextResponse.json({
            success: true,
            markedWatched: result.length,
            targetIndex,
            cascaded: shouldCascade,
            stats: {
                watchedCount,
                unwatchedCount,
                totalCount: allPlaylistVideos.length,
            },
        })
    } catch (error) {
        console.error('Error marking video as watched:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to mark video as watched' },
            { status: 500 },
        )
    }
}

// DELETE /api/playlists/[id]/videos/[videoId]/watched
// Mark a video as unwatched (does not cascade)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id, videoId } = await params
        const playlistId = parseInt(id, 10)
        const targetVideoId = parseInt(videoId, 10)

        if (Number.isNaN(playlistId) || Number.isNaN(targetVideoId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid playlist or video ID' },
                { status: 400 },
            )
        }

        // Verify video exists in playlist
        const [video] = await db
            .select()
            .from(videos)
            .where(
                and(
                    eq(videos.id, targetVideoId),
                    eq(videos.playlistId, playlistId),
                ),
            )
            .limit(1)

        if (!video) {
            return NextResponse.json(
                { success: false, error: 'Video not found in playlist' },
                { status: 404 },
            )
        }

        // Mark just this video as unwatched
        await db
            .update(videos)
            .set({ isWatched: false, updatedAt: new Date() })
            .where(eq(videos.id, targetVideoId))

        // Get updated playlist stats
        const allPlaylistVideos = await db
            .select()
            .from(videos)
            .where(eq(videos.playlistId, playlistId))

        const watchedCount = allPlaylistVideos.filter((v) => v.isWatched).length
        const unwatchedCount = allPlaylistVideos.length - watchedCount

        return NextResponse.json({
            success: true,
            stats: {
                watchedCount,
                unwatchedCount,
                totalCount: allPlaylistVideos.length,
            },
        })
    } catch (error) {
        console.error('Error marking video as unwatched:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to mark video as unwatched' },
            { status: 500 },
        )
    }
}
