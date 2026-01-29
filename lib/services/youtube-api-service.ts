/**
 * YouTube Data API v3 Service
 *
 * Fetches playlist information and items from YouTube.
 * Requires YOUTUBE_API_KEY environment variable to be set.
 */

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

export interface YouTubePlaylistInfo {
    playlistId: string
    title: string
    description: string
    thumbnailUrl: string
    channelTitle: string
    itemCount: number
}

export interface YouTubePlaylistItem {
    videoId: string
    title: string
    description: string
    thumbnailUrl: string
    position: number // 0-based index
    channelTitle: string
}

interface YouTubeApiError {
    error: {
        code: number
        message: string
        errors: Array<{ reason: string; message: string }>
    }
}

function getApiKey(): string {
    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
        throw new Error(
            'YOUTUBE_API_KEY environment variable is not configured. ' +
                'Please add your YouTube Data API v3 key to .env.local',
        )
    }
    return apiKey
}

/**
 * Fetches playlist metadata from YouTube
 */
export async function getPlaylistInfo(
    playlistId: string,
): Promise<YouTubePlaylistInfo> {
    const apiKey = getApiKey()

    const url = new URL(`${YOUTUBE_API_BASE}/playlists`)
    url.searchParams.set('part', 'snippet,contentDetails')
    url.searchParams.set('id', playlistId)
    url.searchParams.set('key', apiKey)

    const response = await fetch(url.toString())

    if (!response.ok) {
        const error = (await response.json()) as YouTubeApiError
        throw new Error(
            `YouTube API error: ${error.error?.message || response.statusText}`,
        )
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
        throw new Error(`Playlist not found: ${playlistId}`)
    }

    const playlist = data.items[0]
    const snippet = playlist.snippet
    const contentDetails = playlist.contentDetails

    // Get the best thumbnail available
    const thumbnails = snippet.thumbnails
    const thumbnailUrl =
        thumbnails.maxres?.url ||
        thumbnails.high?.url ||
        thumbnails.medium?.url ||
        thumbnails.default?.url ||
        ''

    return {
        playlistId,
        title: snippet.title || 'Untitled Playlist',
        description: snippet.description || '',
        thumbnailUrl,
        channelTitle: snippet.channelTitle || '',
        itemCount: contentDetails.itemCount || 0,
    }
}

/**
 * Fetches all items in a playlist with pagination support
 * YouTube API returns max 50 items per request
 */
export async function getPlaylistItems(
    playlistId: string,
): Promise<YouTubePlaylistItem[]> {
    const apiKey = getApiKey()
    const items: YouTubePlaylistItem[] = []
    let pageToken: string | undefined

    do {
        const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`)
        url.searchParams.set('part', 'snippet')
        url.searchParams.set('playlistId', playlistId)
        url.searchParams.set('maxResults', '50')
        url.searchParams.set('key', apiKey)

        if (pageToken) {
            url.searchParams.set('pageToken', pageToken)
        }

        const response = await fetch(url.toString())

        if (!response.ok) {
            const error = (await response.json()) as YouTubeApiError
            throw new Error(
                `YouTube API error: ${error.error?.message || response.statusText}`,
            )
        }

        const data = await response.json()

        for (const item of data.items || []) {
            const snippet = item.snippet

            // Skip deleted/private videos (they have no videoId in resourceId)
            if (!snippet.resourceId?.videoId) {
                continue
            }

            // Get the best thumbnail available
            const thumbnails = snippet.thumbnails || {}
            const thumbnailUrl =
                thumbnails.maxres?.url ||
                thumbnails.high?.url ||
                thumbnails.medium?.url ||
                thumbnails.default?.url ||
                ''

            items.push({
                videoId: snippet.resourceId.videoId,
                title: snippet.title || 'Untitled Video',
                description: snippet.description || '',
                thumbnailUrl,
                position: snippet.position,
                channelTitle: snippet.videoOwnerChannelTitle || '',
            })
        }

        pageToken = data.nextPageToken
    } while (pageToken)

    return items
}

/**
 * Checks if a playlist has been updated by comparing item counts
 * Returns true if the playlist has more or fewer items than expected
 */
export async function checkPlaylistUpdated(
    playlistId: string,
    lastKnownItemCount: number,
): Promise<boolean> {
    const info = await getPlaylistInfo(playlistId)
    return info.itemCount !== lastKnownItemCount
}

/**
 * Validates a YouTube playlist ID format
 * Playlist IDs typically start with 'PL', 'UU', 'FL', 'LL', 'RD', or 'OL'
 */
export function isValidPlaylistId(playlistId: string): boolean {
    if (!playlistId || playlistId.length < 10) {
        return false
    }
    // Common playlist ID prefixes
    const validPrefixes = ['PL', 'UU', 'FL', 'LL', 'RD', 'OL']
    return validPrefixes.some((prefix) => playlistId.startsWith(prefix))
}

/**
 * Builds a YouTube watch URL for a video in a playlist at a specific index
 * YouTube uses 1-based indexing for the index parameter
 */
export function buildPlaylistWatchUrl(
    videoId: string,
    playlistId: string,
    index: number,
): string {
    const url = new URL('https://www.youtube.com/watch')
    url.searchParams.set('v', videoId)
    url.searchParams.set('list', playlistId)
    url.searchParams.set('index', String(index + 1)) // Convert 0-based to 1-based
    return url.toString()
}

export const YouTubeApiService = {
    getPlaylistInfo,
    getPlaylistItems,
    checkPlaylistUpdated,
    isValidPlaylistId,
    buildPlaylistWatchUrl,
}
