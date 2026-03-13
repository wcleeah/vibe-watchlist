import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { playlists, videos } from '@/lib/db/schema'
import { YouTubeApiService } from '@/lib/services/youtube-api-service'

interface RouteParams {
    params: Promise<{ id: string }>
}

function toLoggableError(error: unknown): Record<string, unknown> {
    if (!(error instanceof Error)) {
        return { raw: error }
    }

    const drizzleLike = error as Error & {
        cause?: unknown
        query?: string
        params?: unknown
        code?: string
        detail?: string
        hint?: string
        severity?: string
    }

    return {
        name: drizzleLike.name,
        message: drizzleLike.message,
        stack: drizzleLike.stack,
        code: drizzleLike.code,
        query: drizzleLike.query,
        params: drizzleLike.params,
        detail: drizzleLike.detail,
        hint: drizzleLike.hint,
        severity: drizzleLike.severity,
        cause:
            drizzleLike.cause instanceof Error
                ? {
                      name: drizzleLike.cause.name,
                      message: drizzleLike.cause.message,
                      stack: drizzleLike.cause.stack,
                  }
                : drizzleLike.cause,
    }
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

        const youtubeItems = await YouTubeApiService.getPlaylistItems(
            playlist.youtubePlaylistId,
        )

        const currentVideos = await db
            .select({
                youtubeVideoId: videos.youtubeVideoId,
                isWatched: videos.isWatched,
                title: videos.title,
                thumbnailUrl: videos.thumbnailUrl,
            })
            .from(videos)
            .where(eq(videos.playlistId, playlistId))

        const currentVideoMap = new Map(
            currentVideos
                .filter(
                    (
                        video,
                    ): video is {
                        youtubeVideoId: string
                        isWatched: boolean | null
                        title: string | null
                        thumbnailUrl: string | null
                    } => typeof video.youtubeVideoId === 'string',
                )
                .map((video) => [video.youtubeVideoId, video]),
        )
        const youtubeVideoIds = new Set(
            youtubeItems.map((item) => item.videoId),
        )

        const added = youtubeItems.filter(
            (item) => !currentVideoMap.has(item.videoId),
        ).length
        const removed = currentVideos.filter(
            (video) =>
                video.youtubeVideoId &&
                !youtubeVideoIds.has(video.youtubeVideoId),
        ).length

        const rebuiltVideos = youtubeItems.map((item) => {
            const existingVideo = currentVideoMap.get(item.videoId)

            return {
                url: `https://www.youtube.com/watch?v=${item.videoId}`,
                title: existingVideo?.title ?? item.title,
                platform: 'youtube',
                thumbnailUrl:
                    existingVideo?.thumbnailUrl ?? item.thumbnailUrl ?? null,
                isWatched: existingVideo?.isWatched ?? false,
                playlistId,
                playlistIndex: item.position,
                youtubeVideoId: item.videoId,
            }
        })

        const now = new Date()
        if (rebuiltVideos.length > 0) {
            await db.batch([
                db.delete(videos).where(eq(videos.playlistId, playlistId)),
                db.insert(videos).values(rebuiltVideos),
                db
                    .update(playlists)
                    .set({
                        itemCount: youtubeItems.length,
                        lastSyncedAt: now,
                        updatedAt: now,
                    })
                    .where(eq(playlists.id, playlistId)),
            ])
        } else {
            await db.batch([
                db.delete(videos).where(eq(videos.playlistId, playlistId)),
                db
                    .update(playlists)
                    .set({
                        itemCount: youtubeItems.length,
                        lastSyncedAt: now,
                        updatedAt: now,
                    })
                    .where(eq(playlists.id, playlistId)),
            ])
        }

        return NextResponse.json({
            success: true,
            sync: {
                added,
                removed,
            },
        })
    } catch (error) {
        console.error('Error syncing playlist:', toLoggableError(error))
        const message =
            error instanceof Error ? error.message : 'Failed to sync playlist'
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 },
        )
    }
}
