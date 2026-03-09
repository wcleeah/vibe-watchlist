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

export interface YouTubeVideoMetadata {
    videoId: string
    title: string
    description: string
    thumbnailUrl: string
    channelTitle: string
    publishedAt: string
    language?: string
}

export interface YouTubeVideoMetadataMultiLang {
    videoId: string
    original: YouTubeVideoMetadata
    languages: Map<string, YouTubeVideoMetadata>
}

export interface LocalizedMetadataOption {
    languageCode: string
    languageName: string
    title: string
    description: string
    thumbnailUrl: string
    isOriginal: boolean
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

/**
 * Supported language codes for YouTube metadata localization
 */
export const SUPPORTED_LANGUAGE_CODES = {
    ENGLISH: 'en',
    CHINESE_TRADITIONAL_TW: 'zh-TW',
    CHINESE_TRADITIONAL_HK: 'zh-HK',
    CHINESE_TRADITIONAL: 'zh-Hant',
} as const

/**
 * Language names for display
 */
export const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English',
    'zh-TW': 'Chinese (Traditional - Taiwan)',
    'zh-HK': 'Chinese (Traditional - Hong Kong)',
    'zh-Hant': 'Chinese (Traditional)',
    original: 'Original Title',
}

/**
 * Validates if a language code is supported
 */
export function isValidLanguageCode(code: string): boolean {
    const supportedLanguageCodes = Object.values(
        SUPPORTED_LANGUAGE_CODES,
    ) as readonly string[]

    return supportedLanguageCodes.includes(code) || code === 'original'
}

/**
 * Extracts YouTube video ID from various URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
    try {
        const urlObj = new URL(url)

        // youtu.be/VIDEO_ID format
        if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.slice(1) || null
        }

        // youtube.com/watch?v=VIDEO_ID format
        if (urlObj.hostname.includes('youtube.com')) {
            // Standard watch URL
            if (urlObj.pathname === '/watch') {
                return urlObj.searchParams.get('v')
            }
            // Shorts URL: /shorts/VIDEO_ID
            if (urlObj.pathname.startsWith('/shorts/')) {
                return urlObj.pathname.split('/')[2] || null
            }
            // Embed URL: /embed/VIDEO_ID
            if (urlObj.pathname.startsWith('/embed/')) {
                return urlObj.pathname.split('/')[2] || null
            }
            // Live URL: /live/VIDEO_ID
            if (urlObj.pathname.startsWith('/live/')) {
                return urlObj.pathname.split('/')[2] || null
            }
        }

        return null
    } catch {
        return null
    }
}

/**
 * Fetches video metadata for a specific language
 */
async function fetchVideoMetadataWithLanguage(
    videoId: string,
    hl?: string,
): Promise<YouTubeVideoMetadata | null> {
    const apiKey = getApiKey()

    const url = new URL(`${YOUTUBE_API_BASE}/videos`)
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('id', videoId)
    url.searchParams.set('key', apiKey)

    if (hl) {
        url.searchParams.set('hl', hl)
    }

    const response = await fetch(url.toString())

    if (!response.ok) {
        const error = (await response.json()) as YouTubeApiError
        console.error(
            `YouTube API error for video ${videoId}${hl ? ` (hl=${hl})` : ''}:`,
            error.error?.message || response.statusText,
        )
        return null
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
        console.warn(`Video not found: ${videoId}`)
        return null
    }

    const video = data.items[0]
    const snippet = video.snippet

    // Get the best thumbnail available
    const thumbnails = snippet.thumbnails || {}
    const thumbnailUrl =
        thumbnails.maxres?.url ||
        thumbnails.high?.url ||
        thumbnails.medium?.url ||
        thumbnails.default?.url ||
        ''

    // Use localized title/description when available (when hl parameter is used)
    const localizedTitle = snippet.localized?.title || snippet.title
    const localizedDescription =
        snippet.localized?.description || snippet.description

    return {
        videoId,
        title: localizedTitle || 'Untitled Video',
        description: localizedDescription || '',
        thumbnailUrl,
        channelTitle: snippet.channelTitle || '',
        publishedAt: snippet.publishedAt || '',
        language: hl,
    }
}

/**
 * Fetches video metadata in multiple languages and returns options for user selection
 *
 * @param videoId - The YouTube video ID
 * @param languageCodes - Array of language codes to fetch (defaults to ['en', 'zh-TW', 'zh-HK', 'zh-Hant'])
 * @returns Object containing all metadata options including original
 */
export async function fetchYouTubeVideoMetadataMultiLang(
    videoId: string,
    languageCodes: string[] = [
        SUPPORTED_LANGUAGE_CODES.ENGLISH,
        SUPPORTED_LANGUAGE_CODES.CHINESE_TRADITIONAL_TW,
        SUPPORTED_LANGUAGE_CODES.CHINESE_TRADITIONAL_HK,
        SUPPORTED_LANGUAGE_CODES.CHINESE_TRADITIONAL,
    ],
): Promise<{
    videoId: string
    options: LocalizedMetadataOption[]
}> {
    // Fetch original metadata (no hl parameter)
    const originalMetadata = await fetchVideoMetadataWithLanguage(videoId)

    if (!originalMetadata) {
        throw new Error(`Failed to fetch metadata for video: ${videoId}`)
    }

    const options: LocalizedMetadataOption[] = [
        {
            languageCode: 'original',
            languageName: LANGUAGE_NAMES.original,
            title: originalMetadata.title,
            description: originalMetadata.description,
            thumbnailUrl: originalMetadata.thumbnailUrl,
            isOriginal: true,
        },
    ]

    // Fetch metadata for each requested language
    const languagePromises = languageCodes.map(async (code) => {
        try {
            const metadata = await fetchVideoMetadataWithLanguage(videoId, code)

            if (metadata) {
                // Only add if the title is different from original
                if (metadata.title !== originalMetadata.title) {
                    options.push({
                        languageCode: code,
                        languageName: LANGUAGE_NAMES[code] || code,
                        title: metadata.title,
                        description: metadata.description,
                        thumbnailUrl: metadata.thumbnailUrl,
                        isOriginal: false,
                    })
                }
            }
        } catch (error) {
            console.warn(
                `Failed to fetch metadata for video ${videoId} with language ${code}:`,
                error,
            )
        }
    })

    await Promise.all(languagePromises)

    return {
        videoId,
        options,
    }
}

export const YouTubeApiService = {
    getPlaylistInfo,
    getPlaylistItems,
    checkPlaylistUpdated,
    isValidPlaylistId,
    buildPlaylistWatchUrl,
    fetchYouTubeVideoMetadataMultiLang,
    extractYouTubeVideoId,
    isValidLanguageCode,
    SUPPORTED_LANGUAGE_CODES,
    LANGUAGE_NAMES,
}
