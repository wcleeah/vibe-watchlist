import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { playlists } from '@/lib/db/schema'
import { PlatformDataService } from '@/lib/services/platform-data-service'
import { YouTubeApiService } from '@/lib/services/youtube-api-service'
import { parseVideoUrlWithPlatforms } from '@/lib/utils/url-parser'

// POST /api/playlists/preview - Get playlist info without importing
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
                    existingPlaylistId: existing[0].id,
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

        return NextResponse.json({
            success: true,
            preview: {
                playlistId: playlistInfo.playlistId,
                title: playlistInfo.title,
                description: playlistInfo.description,
                thumbnailUrl: playlistInfo.thumbnailUrl,
                channelTitle: playlistInfo.channelTitle,
                itemCount: playlistInfo.itemCount,
            },
        })
    } catch (error) {
        console.error('Error fetching playlist preview:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch playlist preview' },
            { status: 500 },
        )
    }
}
