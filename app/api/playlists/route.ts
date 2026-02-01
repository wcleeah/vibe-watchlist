import { asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { playlists, playlistTags, tags, videos } from '@/lib/db/schema'
import { PlatformDataService } from '@/lib/services/platform-data-service'
import {
    YouTubeApiService,
    type YouTubePlaylistItem,
} from '@/lib/services/youtube-api-service'
import { parseVideoUrlWithPlatforms } from '@/lib/utils/url-parser'

// GET /api/playlists - Get all playlists with progress stats
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') // 'all' | 'has-unwatched' | 'completed'
        const search = searchParams.get('search')
        const isCompleted = searchParams.get('isCompleted')
        const platform = searchParams.get('platform') // single platform filter
        const tagIdsParam = searchParams.get('tagIds') // comma-separated tag IDs
        const channelTitle = searchParams.get('channelTitle') // channel filter
        const sortBy = searchParams.get('sortBy') // 'custom' or other values

        // Determine order - only use sortOrder column for custom order
        const useCustomOrder = sortBy === 'custom' || !sortBy

        // Get all playlists with aggregated video stats and tags
        const result = await db
            .select({
                id: playlists.id,
                youtubePlaylistId: playlists.youtubePlaylistId,
                title: playlists.title,
                description: playlists.description,
                thumbnailUrl: playlists.thumbnailUrl,
                channelTitle: playlists.channelTitle,
                platform: playlists.platform,
                itemCount: playlists.itemCount,
                isWatched: playlists.isWatched,
                lastSyncedAt: playlists.lastSyncedAt,
                createdAt: playlists.createdAt,
                updatedAt: playlists.updatedAt,
                sortOrder: playlists.sortOrder,
                watchedCount: sql<number>`COALESCE(SUM(CASE WHEN ${videos.isWatched} = true THEN 1 ELSE 0 END), 0)::int`,
                unwatchedCount: sql<number>`COALESCE(SUM(CASE WHEN ${videos.isWatched} = false OR ${videos.isWatched} IS NULL THEN 1 ELSE 0 END), 0)::int`,
            })
            .from(playlists)
            .leftJoin(videos, eq(videos.playlistId, playlists.id))
            .groupBy(playlists.id)
            .orderBy(
                useCustomOrder
                    ? asc(playlists.sortOrder)
                    : desc(playlists.createdAt),
                desc(playlists.createdAt),
            )

        // Get tags for all playlists
        const playlistIds = result.map((p) => p.id)
        const allPlaylistTags =
            playlistIds.length > 0
                ? await db
                      .select({
                          playlistId: playlistTags.playlistId,
                          tagId: tags.id,
                          tagName: tags.name,
                          tagColor: tags.color,
                      })
                      .from(playlistTags)
                      .innerJoin(tags, eq(playlistTags.tagId, tags.id))
                      .where(inArray(playlistTags.playlistId, playlistIds))
                : []

        // Group tags by playlist ID
        const tagsByPlaylist = new Map<
            number,
            Array<{ id: number; name: string; color: string | null }>
        >()
        for (const pt of allPlaylistTags) {
            if (!tagsByPlaylist.has(pt.playlistId)) {
                tagsByPlaylist.set(pt.playlistId, [])
            }
            tagsByPlaylist.get(pt.playlistId)!.push({
                id: pt.tagId,
                name: pt.tagName,
                color: pt.tagColor,
            })
        }

        // Map playlists with their tags
        let filteredResult = result.map((p) => ({
            ...p,
            tags: tagsByPlaylist.get(p.id) || [],
        }))

        // Filter by search term
        if (search?.trim()) {
            const searchLower = search.toLowerCase()
            filteredResult = filteredResult.filter(
                (p) =>
                    p.title?.toLowerCase().includes(searchLower) ||
                    p.channelTitle?.toLowerCase().includes(searchLower),
            )
        }

        // Filter by platform
        if (platform?.trim()) {
            filteredResult = filteredResult.filter(
                (p) => p.platform === platform.trim(),
            )
        }

        // Filter by channel title
        if (channelTitle?.trim()) {
            const channelLower = channelTitle.toLowerCase()
            filteredResult = filteredResult.filter((p) =>
                p.channelTitle?.toLowerCase().includes(channelLower),
            )
        }

        // Filter by tags
        if (tagIdsParam?.trim()) {
            const tagIds = tagIdsParam
                .split(',')
                .map((id) => parseInt(id.trim(), 10))
                .filter((id) => !Number.isNaN(id))
            if (tagIds.length > 0) {
                filteredResult = filteredResult.filter((p) =>
                    tagIds.some((tagId) => p.tags.some((t) => t.id === tagId)),
                )
            }
        }

        // Filter by isCompleted (new filter for tabs)
        if (isCompleted !== null) {
            if (isCompleted === 'true') {
                // Completed = all videos watched (unwatched = 0)
                filteredResult = filteredResult.filter(
                    (p) => p.unwatchedCount === 0 && (p.itemCount ?? 0) > 0,
                )
            } else if (isCompleted === 'false') {
                // Active = has unwatched videos
                filteredResult = filteredResult.filter(
                    (p) => p.unwatchedCount > 0 || (p.itemCount ?? 0) === 0,
                )
            }
        }

        // Filter by status (legacy filter, still supported)
        if (status === 'has-unwatched') {
            filteredResult = filteredResult.filter((p) => p.unwatchedCount > 0)
        } else if (status === 'completed') {
            filteredResult = filteredResult.filter(
                (p) => p.unwatchedCount === 0,
            )
        }

        return NextResponse.json({
            success: true,
            playlists: filteredResult,
        })
    } catch (error) {
        console.error('Error fetching playlists:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch playlists' },
            { status: 500 },
        )
    }
}

// POST /api/playlists - Import a new playlist from YouTube
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { url } = body

        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { success: false, error: 'URL is required' },
                { status: 400 },
            )
        }

        // Parse URL to extract playlist ID
        const platforms = await PlatformDataService.getPlatforms()
        const parsed = parseVideoUrlWithPlatforms(url, platforms)

        if (!parsed.isValid || !parsed.playlistId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid YouTube playlist URL. Please provide a URL containing a playlist ID.',
                },
                { status: 400 },
            )
        }

        const playlistId = parsed.playlistId

        // Check if playlist already exists
        const existing = await db
            .select()
            .from(playlists)
            .where(eq(playlists.youtubePlaylistId, playlistId))
            .limit(1)

        if (existing.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'This playlist has already been added to your watchlist',
                },
                { status: 409 },
            )
        }

        // Fetch playlist info from YouTube
        let playlistInfo: Awaited<
            ReturnType<typeof YouTubeApiService.getPlaylistInfo>
        >
        try {
            playlistInfo = await YouTubeApiService.getPlaylistInfo(playlistId)
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Unknown error'
            return NextResponse.json(
                {
                    success: false,
                    error: `Failed to fetch playlist from YouTube: ${message}`,
                },
                { status: 400 },
            )
        }

        // Fetch all playlist items
        let playlistItems: YouTubePlaylistItem[]
        try {
            playlistItems = await YouTubeApiService.getPlaylistItems(playlistId)
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Unknown error'
            return NextResponse.json(
                {
                    success: false,
                    error: `Failed to fetch playlist items: ${message}`,
                },
                { status: 400 },
            )
        }

        // Create playlist record
        const [newPlaylist] = await db
            .insert(playlists)
            .values({
                youtubePlaylistId: playlistId,
                title: playlistInfo.title,
                description: playlistInfo.description,
                thumbnailUrl: playlistInfo.thumbnailUrl,
                channelTitle: playlistInfo.channelTitle,
                itemCount: playlistItems.length,
                lastSyncedAt: new Date(),
            })
            .returning()

        // Create video records for each playlist item
        if (playlistItems.length > 0) {
            const videoValues = playlistItems.map((item) => ({
                url: `https://www.youtube.com/watch?v=${item.videoId}`,
                title: item.title,
                platform: 'youtube',
                thumbnailUrl: item.thumbnailUrl || null,
                isWatched: false,
                playlistId: newPlaylist.id,
                playlistIndex: item.position,
                youtubeVideoId: item.videoId,
            }))

            await db.insert(videos).values(videoValues)
        }

        return NextResponse.json(
            {
                success: true,
                playlist: {
                    ...newPlaylist,
                    watchedCount: 0,
                    unwatchedCount: playlistItems.length,
                },
            },
            { status: 201 },
        )
    } catch (error) {
        console.error('Error creating playlist:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create playlist' },
            { status: 500 },
        )
    }
}
