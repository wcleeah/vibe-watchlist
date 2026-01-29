export type VideoPlatform = string // Dynamic platform ID from platformConfigs

export interface ParsedUrl {
    url: string
    platform: VideoPlatform
    videoId?: string
    playlistId?: string
    isPlaylist: boolean // true if this is a playlist URL
    isValid: boolean
    error?: string
}

/**
 * Pure function that parses URLs using provided platform configurations
 * No dependencies on databases or APIs - can be used anywhere
 */
export function parseVideoUrlWithPlatforms(
    url: string,
    platforms: Array<{
        platformId: string
        patterns: string[]
        enabled: boolean | null
    }>,
): ParsedUrl {
    if (!url || typeof url !== 'string') {
        return { url, platform: 'unknown', isPlaylist: false, isValid: false }
    }

    try {
        const urlObj = new URL(url)

        // Check against each platform's patterns
        for (const platform of platforms) {
            if (!platform.enabled || !platform.patterns) continue

            // Check if hostname matches any of the platform's patterns
            const matchesPattern = platform.patterns.some((pattern: string) =>
                urlObj.href.includes(pattern.toLowerCase()),
            )

            if (matchesPattern) {
                // Extract video ID based on platform
                const videoId = extractVideoId(urlObj, platform.platformId)

                // Extract playlist ID for YouTube
                const playlistId =
                    platform.platformId === 'youtube'
                        ? extractYouTubePlaylistId(urlObj)
                        : undefined

                // Determine if this is primarily a playlist URL
                // A URL is considered a playlist if it has a playlist ID but no video ID,
                // OR if it's a dedicated playlist URL (youtube.com/playlist)
                const isPlaylistUrl =
                    urlObj.pathname.includes('/playlist') ||
                    (playlistId && !videoId)

                return {
                    url,
                    platform: platform.platformId,
                    videoId,
                    playlistId: playlistId || undefined,
                    isPlaylist: Boolean(isPlaylistUrl),
                    isValid: true,
                }
            }
        }

        // Accept any valid HTTPS URL as unknown platform
        return {
            url,
            platform: 'unknown',
            isPlaylist: false,
            isValid: true,
        }
    } catch {
        return {
            url,
            platform: 'unknown',
            isPlaylist: false,
            isValid: false,
            error: 'Invalid URL',
        }
    }
}

/**
 * Client-side URL parser that fetches platforms via API
 */
export async function parseVideoUrlClient(url: string): Promise<ParsedUrl> {
    // Fetch platforms from API
    const response = await fetch('/api/platforms')
    if (!response.ok) {
        throw new Error('Failed to fetch platforms')
    }

    const data = await response.json()
    const platforms = data.data || []

    return parseVideoUrlWithPlatforms(url, platforms)
}

function extractYouTubeId(urlObj: URL): string | null {
    const hostname = urlObj.hostname.toLowerCase()

    // youtube.com/watch?v=VIDEO_ID
    if (hostname.includes('youtube.com')) {
        const videoId = urlObj.searchParams.get('v')
        if (videoId && videoId.length === 11) {
            return videoId
        }
    }

    // youtu.be/VIDEO_ID
    if (hostname.includes('youtu.be')) {
        const path = urlObj.pathname.slice(1) // remove leading /
        if (path.length === 11) {
            return path
        }
    }

    return null
}

function extractYouTubePlaylistId(urlObj: URL): string | null {
    const playlistId = urlObj.searchParams.get('list')
    // Common playlist ID prefixes: PL (user), UU (uploads), FL (favorites),
    // LL (liked), RD (radio/mix), OL (other)
    if (playlistId && playlistId.length > 2) {
        return playlistId
    }
    return null
}

function extractTwitchId(urlObj: URL): string | undefined {
    const path = urlObj.pathname

    // twitch.tv/videos/{id}
    const videoMatch = path.match(/^\/videos\/(\d+)$/)
    if (videoMatch) {
        return videoMatch[1]
    }

    return undefined
}

function extractVideoId(urlObj: URL, platformId: string): string | undefined {
    const _hostname = urlObj.hostname.toLowerCase()

    switch (platformId) {
        case 'youtube':
            return extractYouTubeId(urlObj) || undefined
        case 'twitch':
            return extractTwitchId(urlObj)
        // Add more platform-specific extractors as needed
        default: {
            // For unknown platforms, try common patterns
            const videoId =
                urlObj.searchParams.get('v') ||
                urlObj.searchParams.get('video_id') ||
                urlObj.searchParams.get('id')
            return videoId || undefined
        }
    }
}

export async function detectPlatform(
    url: string,
): Promise<VideoPlatform | null> {
    const parsed = await parseVideoUrlClient(url)
    return parsed.isValid ? parsed.platform : null
}

export async function detectPlatformClient(
    url: string,
): Promise<VideoPlatform | null> {
    const parsed = await parseVideoUrlClient(url)
    return parsed.isValid ? parsed.platform : null
}
