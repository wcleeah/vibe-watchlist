import { PlatformDataService } from '@/lib/services/platform-data-service'
import { parseVideoUrlWithPlatforms } from '../utils/url-parser'
import { MetascraperService } from './metascraper-service'

export interface VideoMetadata {
    title: string
    thumbnailUrl: string | null
    authorName?: string
    authorUrl?: string
}

/**
 * Resolves Twitch thumbnail URL templates
 */
function resolveTwitchThumbnailUrl(
    templateUrl: string,
    width = 320,
    height = 180,
): string {
    if (!templateUrl) return templateUrl

    return templateUrl
        .replace(/%{width}/g, width.toString())
        .replace(/%{height}/g, height.toString())
        .replace(/{width}/g, width.toString())
        .replace(/{height}/g, height.toString())
}

/**
 * Get Twitch access token for API calls
 */
async function getTwitchAccessToken(): Promise<string> {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: process.env.TWITCH_CLIENT_ID!,
            client_secret: process.env.TWITCH_CLIENT_SECRET!,
            grant_type: 'client_credentials',
        }),
    })

    if (!response.ok) {
        console.log(
            '🔑 TWITCH TOKEN: Token request failed with status:',
            response.status,
        )

        // Log response body for debugging
        try {
            const errorBody = await response.text()
            console.log(
                '🔑 TWITCH TOKEN: Error response body:',
                errorBody.substring(0, 500),
            )
        } catch (bodyError) {
            console.log(
                '🔑 TWITCH TOKEN: Could not read error response body:',
                bodyError,
            )
        }

        throw new Error(`Twitch token request failed: ${response.status}`)
    }

    const data = await response.json()
    return data.access_token
}

export class SharedMetadataService {
    /**
     * Extract metadata from YouTube using oEmbed API
     * @param url - The YouTube video URL
     * @param languageCode - Optional language code (e.g., 'en', 'zh-TW', 'zh-HK')
     */
    static async extractYouTubeMetadata(
        url: string,
        languageCode?: string,
    ): Promise<VideoMetadata> {
        const params = new URLSearchParams({
            url: url,
            format: 'json',
        })

        if (languageCode) {
            params.set('hl', languageCode)
        }

        const oEmbedUrl = `https://www.youtube.com/oembed?${params.toString()}`

        const response = await fetch(oEmbedUrl, {
            headers: {
                'User-Agent': 'Video Watchlist AI/1.0',
            },
        })

        if (!response.ok) {
            console.log(
                '📺 YOUTUBE OEMBED: API request failed with status:',
                response.status,
            )

            // Log response body for debugging
            try {
                const errorBody = await response.text()
                console.log(
                    '📺 YOUTUBE OEMBED: Error response body:',
                    errorBody.substring(0, 500),
                )
            } catch (bodyError) {
                console.log(
                    '📺 YOUTUBE OEMBED: Could not read error response body:',
                    bodyError,
                )
            }

            throw new Error(`YouTube oEmbed API error: ${response.status}`)
        }

        const data = await response.json()

        return {
            title: data.title || 'Untitled YouTube Video',
            thumbnailUrl: data.thumbnail_url || null,
            authorName: data.author_name,
            authorUrl: data.author_url,
        }
    }

    /**
     * Supported language codes for YouTube oEmbed
     */
    static readonly SUPPORTED_LANGUAGE_CODES = {
        ENGLISH: 'en',
        CHINESE_TRADITIONAL_TW: 'zh-TW',
        CHINESE_TRADITIONAL_HK: 'zh-HK',
        CHINESE_TRADITIONAL: 'zh-Hant',
    } as const

    static readonly LANGUAGE_NAMES: Record<string, string> = {
        en: 'English',
        'zh-TW': 'Chinese (Traditional - Taiwan)',
        'zh-HK': 'Chinese (Traditional - Hong Kong)',
        'zh-Hant': 'Chinese (Traditional)',
        original: 'Original Title',
    }

    /**
     * Extract metadata from YouTube using oEmbed API in multiple languages
     *
     * @param url - The YouTube video URL
     * @param languageCodes - Array of language codes to fetch (defaults to all supported)
     * @returns Array of metadata options including original
     */
    static async extractYouTubeMetadataMultiLang(
        url: string,
        languageCodes: string[] = [
            SharedMetadataService.SUPPORTED_LANGUAGE_CODES.ENGLISH,
            SharedMetadataService.SUPPORTED_LANGUAGE_CODES
                .CHINESE_TRADITIONAL_TW,
            SharedMetadataService.SUPPORTED_LANGUAGE_CODES
                .CHINESE_TRADITIONAL_HK,
            SharedMetadataService.SUPPORTED_LANGUAGE_CODES.CHINESE_TRADITIONAL,
        ],
    ): Promise<
        Array<{
            languageCode: string
            languageName: string
            metadata: VideoMetadata
            isOriginal: boolean
        }>
    > {
        // Fetch original metadata first
        const originalMetadata =
            await SharedMetadataService.extractYouTubeMetadata(url)

        const results: Array<{
            languageCode: string
            languageName: string
            metadata: VideoMetadata
            isOriginal: boolean
        }> = [
            {
                languageCode: 'original',
                languageName: SharedMetadataService.LANGUAGE_NAMES.original,
                metadata: originalMetadata,
                isOriginal: true,
            },
        ]

        // Fetch metadata for each language
        const fetchPromises = languageCodes.map(async (code) => {
            try {
                const metadata =
                    await SharedMetadataService.extractYouTubeMetadata(
                        url,
                        code,
                    )

                // Only add if title is different from original
                if (metadata.title !== originalMetadata.title) {
                    results.push({
                        languageCode: code,
                        languageName:
                            SharedMetadataService.LANGUAGE_NAMES[code] || code,
                        metadata,
                        isOriginal: false,
                    })
                }
            } catch (error) {
                console.warn(
                    `Failed to fetch YouTube metadata for ${url} with language ${code}:`,
                    error,
                )
            }
        })

        await Promise.all(fetchPromises)

        return results
    }

    /**
     * Extract metadata from Twitch using Helix API
     */
    static async extractTwitchMetadata(url: string): Promise<VideoMetadata> {
        const platforms = await PlatformDataService.getPlatforms()
        const parsed = parseVideoUrlWithPlatforms(url, platforms)

        if (!parsed.videoId) {
            throw new Error('Invalid Twitch video URL')
        }

        const accessToken = await getTwitchAccessToken()

        const apiUrl = `https://api.twitch.tv/helix/videos?id=${parsed.videoId}`

        const response = await fetch(apiUrl, {
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID!,
                Authorization: `Bearer ${accessToken}`,
            },
        })

        if (!response.ok) {
            console.log(
                '🎮 TWITCH HELIX: API request failed with status:',
                response.status,
            )

            // Log response body for debugging
            try {
                const errorBody = await response.text()
                console.log(
                    '🎮 TWITCH HELIX: Error response body:',
                    errorBody.substring(0, 500),
                )
            } catch (bodyError) {
                console.log(
                    '🎮 TWITCH HELIX: Could not read error response body:',
                    bodyError,
                )
            }

            if (response.status === 404) {
                throw new Error('Twitch video not found or private')
            }
            throw new Error(`Twitch API error: ${response.status}`)
        }

        const data = await response.json()

        if (!data.data || data.data.length === 0) {
            throw new Error('Twitch video data not found')
        }

        const video = data.data[0]

        return {
            title: video.title || 'Untitled Twitch Video',
            thumbnailUrl: video.thumbnail_url
                ? resolveTwitchThumbnailUrl(video.thumbnail_url)
                : null,
            authorName: video.user_name,
            authorUrl: video.user_login
                ? `https://twitch.tv/${video.user_login}`
                : undefined,
        }
    }

    /**
     * Extract basic metadata from HTML (fallback for unknown platforms)
     */
    static async extractHtmlMetadata(url: string): Promise<VideoMetadata> {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Video Watchlist AI/1.0',
                },
            })

            if (!response.ok) {
                console.log(
                    '🌐 HTML METADATA FETCH: HTTP request failed with status:',
                    response.status,
                )

                // Log response body for debugging
                try {
                    const errorBody = await response.text()
                    console.log(
                        '🌐 HTML METADATA FETCH: Error response body:',
                        errorBody.substring(0, 500),
                    )
                } catch (bodyError) {
                    console.log(
                        '🌐 HTML METADATA FETCH: Could not read error response body:',
                        bodyError,
                    )
                }

                throw new Error(`Failed to fetch HTML: ${response.status}`)
            }

            const html = await response.text()
            const metadata = await MetascraperService.extractMetadata(html, url)

            return {
                title:
                    metadata.title ||
                    metadata.ogTitle ||
                    metadata.twitterTitle ||
                    'Untitled Video',
                thumbnailUrl: metadata.ogImage || metadata.twitterImage || null,
            }
        } catch (error) {
            console.error('HTML metadata extraction failed:', error)
            return {
                title: 'Untitled Video',
                thumbnailUrl: null,
            }
        }
    }

    /**
     * Determine the extraction strategy for a given platform using database configs
     */
    static async getPlatformStrategyAsync(
        platform: string,
    ): Promise<'official' | 'ai'> {
        try {
            const platformConfig =
                await PlatformDataService.getPlatformById(platform)

            if (!platformConfig) {
                return 'ai' // Unknown platform
            }

            // Strategy based on extractor field from database
            switch (platformConfig.extractor) {
                case 'official':
                    return 'official'
                case 'ai':
                    return 'ai'
                default:
                    return 'ai'
            }
        } catch (error) {
            console.error('Error determining platform strategy:', error)
            return 'ai'
        }
    }
}
