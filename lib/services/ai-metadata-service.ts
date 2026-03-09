import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { aiMetadataCache } from '@/lib/db/schema'
import { AIService } from '@/lib/services/ai-service'
import { MetascraperService } from '@/lib/services/metascraper-service'
import {
    SharedMetadataService,
    type VideoMetadata,
} from '@/lib/services/shared-metadata-service'
import { YouTubeApiService } from '@/lib/services/youtube-api-service'
import type {
    AIMetadataConfig,
    GoogleSearchResult,
    HtmlMetadata,
    MetadataCacheEntry,
    MetadataExtractionResponse,
    MetadataSuggestion,
} from '@/lib/types/ai-metadata'
import { logger } from '@/lib/utils/logger'
import { parseVideoUrlWithPlatforms } from '@/lib/utils/url-parser'
import { PlatformDataService } from './platform-data-service'

/**
 * Main orchestration service for AI-powered metadata extraction
 * Coordinates Google Search, HTML scraping, and AI analysis
 */
export class AIMetadataService {
    private config: AIMetadataConfig
    private aiService: AIService

    constructor(config: AIMetadataConfig) {
        this.config = config
        this.aiService = new AIService()
    }

    async extractMetadata(
        url: string,
        force?: boolean,
    ): Promise<MetadataExtractionResponse> {
        logger.log(
            '🔍 AI METADATA SERVICE: Starting extractMetadata for URL:',
            url,
            'force:',
            force,
        )

        try {
            const cacheDisabled =
                process.env.DISABLE_METADATA_CACHE === 'true' || force

            if (cacheDisabled) {
                logger.log(
                    force
                        ? '🔍 AI METADATA SERVICE: Force refresh requested, skipping cache'
                        : '🔍 AI METADATA SERVICE: Caching disabled, skipping cache check',
                )
            } else {
                logger.log(
                    '🔍 AI METADATA SERVICE: Checking cache for URL:',
                    url,
                )
                const cached = await this.getCachedResult(url)
                logger.log(
                    '🔍 AI METADATA SERVICE: Cache result:',
                    cached
                        ? 'HIT - returning cached data'
                        : 'MISS - proceeding with extraction',
                )

                if (cached) {
                    logger.log(
                        '🔍 AI METADATA SERVICE: Returning cached suggestions:',
                        cached.aiAnalysis?.length || 0,
                        'items',
                    )
                    return {
                        success: true,
                        suggestions: cached.aiAnalysis,
                        fallback: {
                            title: cached.extractedMetadata?.title,
                            thumbnailUrl:
                                cached.extractedMetadata?.ogImage ||
                                cached.extractedMetadata?.twitterImage,
                        },
                    }
                }
            }

            logger.log(
                '🔍 AI METADATA SERVICE: No cache hit, parsing URL for platform detection',
            )
            // Detect platform and route accordingly
            const platforms = await PlatformDataService.getPlatforms()
            const parsed = parseVideoUrlWithPlatforms(url, platforms)
            const platform = parsed.platform
            logger.log('🔍 AI METADATA SERVICE: Parsed platform:', platform)

            const strategy =
                await SharedMetadataService.getPlatformStrategyAsync(platform)
            logger.log(
                '🔍 AI METADATA SERVICE: Selected strategy:',
                strategy,
                'for platform:',
                platform,
            )

            switch (strategy) {
                case 'official':
                    logger.log(
                        '🔍 AI METADATA SERVICE: Routing to handleOfficialPlatform',
                    )
                    return this.handleOfficialPlatform(url, platform)
                case 'ai':
                    logger.log(
                        '🔍 AI METADATA SERVICE: Routing to handleAIPlatform',
                    )
                    return this.handleAIPlatform(url, platform)
                default:
                    throw Error('Fuck the default')
            }
        } catch (error) {
            logger.error(
                '❌ AI METADATA SERVICE: extractMetadata failed:',
                error,
            )
            logger.error(
                '❌ AI METADATA SERVICE: Error details:',
                error instanceof Error ? error.stack : 'Unknown error type',
            )
            return {
                success: false,
                suggestions: [],
                error: `Failed to extract metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }
        }
    }

    /**
     * Handle platforms with official APIs (YouTube, Twitch)
     */
    private async handleOfficialPlatform(
        url: string,
        platform: string,
    ): Promise<MetadataExtractionResponse> {
        logger.log(
            '🎯 OFFICIAL PLATFORM HANDLER: Starting for platform:',
            platform,
            'URL:',
            url,
        )

        try {
            let metadata: VideoMetadata | null | undefined
            logger.log(
                '🎯 OFFICIAL PLATFORM HANDLER: Determining API call based on platform',
            )

            if (platform === 'youtube') {
                logger.log(
                    '🎯 OFFICIAL PLATFORM HANDLER: Fetching YouTube metadata with multiple languages',
                )

                const videoId = YouTubeApiService.extractYouTubeVideoId(url)
                if (!videoId) {
                    // Check if this is a playlist URL
                    const urlObj = new URL(url)
                    const playlistId =
                        urlObj.searchParams.get('list') || undefined

                    if (playlistId) {
                        logger.log(
                            '🎯 OFFICIAL PLATFORM HANDLER: Detected playlist URL, fetching playlist metadata for:',
                            playlistId,
                        )
                        const playlistInfo =
                            await YouTubeApiService.getPlaylistInfo(playlistId)

                        return {
                            success: true,
                            suggestions: [
                                {
                                    title: playlistInfo.title,
                                    thumbnailUrl:
                                        playlistInfo.thumbnailUrl || undefined,
                                    platform,
                                    confidence: 1.0,
                                    reasoning:
                                        'Official YouTube API (Playlist)',
                                },
                            ],
                            fallback: {
                                title: playlistInfo.title,
                                thumbnailUrl:
                                    playlistInfo.thumbnailUrl || undefined,
                            },
                        }
                    }

                    throw new Error('Failed to extract YouTube video ID')
                }

                const multiLangResult =
                    await YouTubeApiService.fetchYouTubeVideoMetadataMultiLang(
                        videoId,
                    )
                logger.log(
                    '🎯 OFFICIAL PLATFORM HANDLER: YouTube multi-language API returned',
                    multiLangResult.options.length,
                    'language options',
                )

                // Fetch HTML content for thumbnail prioritization
                logger.log(
                    '🎯 OFFICIAL PLATFORM HANDLER: Fetching HTML content for thumbnail prioritization',
                )
                const htmlContent = await this.fetchHtmlContent(url)
                logger.log(
                    '🎯 OFFICIAL PLATFORM HANDLER: HTML content fetched, length:',
                    htmlContent.length,
                )

                logger.log(
                    '🎯 OFFICIAL PLATFORM HANDLER: Extracting metadata from HTML',
                )
                const extractedMetadata =
                    await MetascraperService.extractMetadata(htmlContent, url)
                logger.log(
                    '🎯 OFFICIAL PLATFORM HANDLER: HTML metadata extracted - ogImage:',
                    !!extractedMetadata.ogImage,
                    'twitterImage:',
                    !!extractedMetadata.twitterImage,
                )

                // Create suggestions from all language options
                const seenTitles = new Set<string>()
                const suggestions: MetadataSuggestion[] = []

                for (const option of multiLangResult.options) {
                    // Normalize title for deduplication
                    const normalizedTitle = option.title.trim().toLowerCase()
                    if (seenTitles.has(normalizedTitle)) {
                        logger.log(
                            '🎯 OFFICIAL PLATFORM HANDLER: Skipping duplicate title:',
                            option.title,
                        )
                        continue
                    }
                    seenTitles.add(normalizedTitle)

                    // Prioritize thumbnails: HTML meta tags → API thumbnails
                    const thumbnailUrl =
                        extractedMetadata.ogImage ||
                        extractedMetadata.twitterImage ||
                        option.thumbnailUrl ||
                        ''

                    suggestions.push({
                        title: option.title,
                        thumbnailUrl: thumbnailUrl || undefined,
                        platform,
                        confidence: 1.0, // Official API = perfect confidence
                        reasoning: `Official ${platform} API (${option.languageName})`,
                    })
                }

                logger.log(
                    '🎯 OFFICIAL PLATFORM HANDLER: Returning',
                    suggestions.length,
                    'unique language options after deduplication',
                )

                return {
                    success: true,
                    suggestions,
                    fallback: {
                        title: suggestions[0]?.title,
                        thumbnailUrl: suggestions[0]?.thumbnailUrl,
                    },
                }
            } else if (platform === 'twitch') {
                logger.log(
                    '🎯 OFFICIAL PLATFORM HANDLER: Calling Twitch Helix API',
                )
                metadata =
                    await SharedMetadataService.extractTwitchMetadata(url)
                logger.log(
                    '🎯 OFFICIAL PLATFORM HANDLER: Twitch API response:',
                    metadata ? 'SUCCESS' : 'NULL',
                )
            } else {
                logger.log(
                    '🎯 OFFICIAL PLATFORM HANDLER: Unsupported official platform:',
                    platform,
                )
                throw new Error(`Unsupported official platform: ${platform}`)
            }

            logger.log(
                '🎯 OFFICIAL PLATFORM HANDLER: Fetching HTML content for thumbnail prioritization',
            )
            // Fetch HTML content to prioritize meta tag thumbnails
            const htmlContent = await this.fetchHtmlContent(url)
            logger.log(
                '🎯 OFFICIAL PLATFORM HANDLER: HTML content fetched, length:',
                htmlContent.length,
            )

            logger.log(
                '🎯 OFFICIAL PLATFORM HANDLER: Extracting metadata from HTML',
            )
            const extractedMetadata = await MetascraperService.extractMetadata(
                htmlContent,
                url,
            )
            logger.log(
                '🎯 OFFICIAL PLATFORM HANDLER: HTML metadata extracted - ogImage:',
                !!extractedMetadata.ogImage,
                'twitterImage:',
                !!extractedMetadata.twitterImage,
            )

            // Prioritize thumbnails: HTML meta tags → API thumbnails → undefined
            const prioritizedThumbnail =
                extractedMetadata.ogImage ||
                extractedMetadata.twitterImage ||
                metadata.thumbnailUrl

            logger.log(
                '🎯 OFFICIAL PLATFORM HANDLER: Prioritized thumbnail selected:',
                prioritizedThumbnail ? 'HTML meta tag' : 'API thumbnail',
            )

            logger.log(
                '🎯 OFFICIAL PLATFORM HANDLER: Creating response with confidence 1.0',
            )
            const response = {
                success: true,
                suggestions: [
                    {
                        title: metadata.title || 'Untitled Video',
                        thumbnailUrl: prioritizedThumbnail || undefined,
                        platform,
                        confidence: 1.0, // Official API = perfect confidence
                        reasoning: `Official ${platform} API with meta tag thumbnail prioritization`,
                    },
                ],
                fallback: {
                    title: metadata.title || undefined,
                    thumbnailUrl: prioritizedThumbnail || undefined,
                },
            }

            logger.log(
                '🎯 OFFICIAL PLATFORM HANDLER: Returning official platform response with',
                response.suggestions.length,
                'suggestions',
            )
            return response
        } catch (error) {
            // Official API failed - fallback to AI
            logger.warn(
                '! OFFICIAL PLATFORM HANDLER: Official API failed, falling back to AI analysis:',
                error,
            )
            logger.warn(
                '! OFFICIAL PLATFORM HANDLER: Error details:',
                error instanceof Error ? error.message : 'Unknown error',
            )
            logger.log(
                '🎯 OFFICIAL PLATFORM HANDLER: Initiating fallback to AI platform handler',
            )
            return this.handleAIPlatform(url, platform)
        }
    }

    /**
     * Handle unknown platforms with full AI analysis
     */
    private async handleAIPlatform(
        url: string,
        platform: string,
    ): Promise<MetadataExtractionResponse> {
        logger.log(
            '🤖 AI PLATFORM HANDLER: Starting full AI analysis for platform:',
            platform,
            'URL:',
            url,
        )

        // Google Search + HTML + Metascraper + AI Analysis
        logger.log(
            '🤖 AI PLATFORM HANDLER: Starting parallel operations - Google Search and HTML fetch',
        )
        const [searchResults, htmlContent] = await Promise.allSettled([
            this.performGoogleSearch(url),
            this.fetchHtmlContent(url),
        ])

        const googleResults =
            searchResults.status === 'fulfilled' ? searchResults.value : []
        const html = htmlContent.status === 'fulfilled' ? htmlContent.value : ''

        logger.log('🤖 AI PLATFORM HANDLER: Parallel operations complete')
        logger.log(
            '🤖 AI PLATFORM HANDLER: Google search results:',
            googleResults.length,
            'items',
        )
        logger.log(
            '🤖 AI PLATFORM HANDLER: HTML content length:',
            html.length,
            'characters',
        )

        if (searchResults.status === 'rejected') {
            logger.warn(
                '! AI PLATFORM HANDLER: Google search failed:',
                searchResults.reason,
            )
        }
        if (htmlContent.status === 'rejected') {
            logger.warn(
                '! AI PLATFORM HANDLER: HTML fetch failed:',
                htmlContent.reason,
            )
        }

        // Use Metascraper instead of manual regex
        logger.log(
            '🤖 AI PLATFORM HANDLER: Starting Metascraper metadata extraction',
        )
        const extractedMetadata = await MetascraperService.extractMetadata(
            html,
            url,
        )
        logger.log('🤖 AI PLATFORM HANDLER: Metascraper extracted metadata:', {
            hasTitle: !!extractedMetadata.title,
            hasDescription: !!extractedMetadata.description,
            hasOgImage: !!extractedMetadata.ogImage,
            hasTwitterImage: !!extractedMetadata.twitterImage,
        })
        logger.log(
            '🤖 AI PLATFORM HANDLER: Full extracted metadata:',
            JSON.stringify(extractedMetadata, null, 2),
        )

        // AI analysis with Google context
        logger.log('🤖 AI PLATFORM HANDLER: Starting AI analysis with context')
        const suggestions = await this.performAIAnalysis(
            url,
            googleResults,
            html,
            extractedMetadata,
            platform,
        )
        logger.log(
            '🤖 AI PLATFORM HANDLER: AI analysis complete, generated',
            suggestions.length,
            'suggestions',
        )

        // Cache the results
        logger.log('🤖 AI PLATFORM HANDLER: Caching results')
        await this.cacheResults(url, googleResults, html, suggestions)

        const response = {
            success: true,
            suggestions,
            fallback: {
                title: extractedMetadata.title,
                thumbnailUrl:
                    extractedMetadata.ogImage || extractedMetadata.twitterImage,
            },
        }

        logger.log(
            '🤖 AI PLATFORM HANDLER: Returning AI platform response with',
            suggestions.length,
            'suggestions',
        )
        return response
    }

    /**
     * Perform AI analysis using OpenRouter
     */
    private async performAIAnalysis(
        url: string,
        searchResults: GoogleSearchResult[],
        htmlContent: string,
        extractedMetadata: HtmlMetadata,
        platform: string,
    ): Promise<MetadataSuggestion[]> {
        logger.log('🧠 AI ANALYSIS: Starting AI analysis for URL:', url)

        try {
            logger.log('🧠 AI ANALYSIS: Preparing context for AI analysis')
            // Prepare context for AI analysis
            // Extract HTML lang attribute if present
            const htmlLangMatch = htmlContent.match(
                /<html[^>]*\slang=["']([^"']+)["']/i,
            )
            const htmlLang = htmlLangMatch?.[1] || undefined

            const context = {
                url,
                searchResults: searchResults.slice(0, 4).map((r) => ({
                    title: r.title,
                    snippet: r.snippet,
                    hasImage: !!r.pagemap?.cse_image?.[0]?.src,
                })),
                htmlSnippet: htmlContent.slice(0, 2000), // First 2KB of HTML
                extractedMetadata: {
                    title: extractedMetadata.title,
                    ogTitle: extractedMetadata.ogTitle,
                    twitterTitle: extractedMetadata.twitterTitle,
                    description: extractedMetadata.description,
                    hasImage: !!(
                        extractedMetadata.ogImage ||
                        extractedMetadata.twitterImage
                    ),
                },
                ...(htmlLang ? { htmlLanguage: htmlLang } : {}),
            }

            logger.log(
                '🧠 AI ANALYSIS: Context prepared with',
                context.searchResults.length,
                'search results',
            )
            logger.log(
                '🧠 AI ANALYSIS: HTML snippet length:',
                context.htmlSnippet.length,
                'characters',
            )
            logger.log(
                '🧠 AI ANALYSIS: Extracted metadata - title:',
                !!context.extractedMetadata.title,
                'description:',
                !!context.extractedMetadata.description,
                'image:',
                context.extractedMetadata.hasImage,
            )

            // Log the full context object for debugging
            logger.log(
                '🧠 AI ANALYSIS: Full context object:',
                JSON.stringify(context, null, 2),
            )

            // Use existing AIService for title suggestions
            logger.log(
                '🧠 AI ANALYSIS: Calling AIService.generateTitleSuggestions',
            )

            // Log the request parameters being sent to AI service
            const aiServiceRequestParams = {
                metadata: {
                    url,
                    title: extractedMetadata.title,
                },
                searchResults: searchResults,
            }
            logger.log(
                '🧠 AI ANALYSIS: Request parameters to AIService:',
                JSON.stringify(aiServiceRequestParams, null, 2),
            )

            const titleSuggestions =
                await this.aiService.generateTitleSuggestions(
                    {
                        url,
                        title: extractedMetadata.title,
                        platform,
                    },
                    searchResults,
                    ['en', 'zh-TW'],
                )

            logger.log(
                '🧠 AI ANALYSIS: AIService returned',
                titleSuggestions.suggestions?.length || 0,
                'raw suggestions',
            )

            // Log the full response from AI service
            logger.log(
                '🧠 AI ANALYSIS: Full AIService response:',
                JSON.stringify(titleSuggestions, null, 2),
            )

            // Convert to our format
            logger.log(
                '🧠 AI ANALYSIS: Converting suggestions to MetadataSuggestion format',
            )
            const suggestions: MetadataSuggestion[] = await Promise.all(
                titleSuggestions.suggestions.map(async (suggestion) => {
                    const platformInfer = await this.inferPlatform(
                        url,
                        suggestion.title,
                        platform,
                    )
                    const thumbnailUrl = this.inferThumbnail(
                        url,
                        htmlContent,
                        searchResults,
                        extractedMetadata,
                    )

                    // Build reasoning string with language info
                    const langLabel = this.getLanguageDisplayName(
                        suggestion.language,
                    )
                    const reasoning = langLabel
                        ? `AI Analysis (${langLabel}) — ${suggestion.source}`
                        : `AI Analysis — ${suggestion.source}`

                    logger.log('🧠 AI ANALYSIS: Converting suggestion:', {
                        title: `${suggestion.title.substring(0, 50)}...`,
                        confidence: suggestion.confidence,
                        language: suggestion.language,
                        inferredPlatform: platform,
                        hasThumbnail: !!thumbnailUrl,
                    })

                    return {
                        title: suggestion.title,
                        platform: platformInfer,
                        confidence: suggestion.confidence,
                        reasoning,
                        thumbnailUrl: thumbnailUrl,
                        language: suggestion.language || undefined,
                    }
                }),
            )

            logger.log(
                '🧠 AI ANALYSIS: Total suggestions before limiting:',
                suggestions.length,
            )
            const limitedSuggestions = suggestions.slice(0, 5) // Limit to 5 suggestions (allow multi-language variants)
            logger.log(
                '🧠 AI ANALYSIS: Returning',
                limitedSuggestions.length,
                'suggestions after limiting',
            )
            logger.log(
                '🧠 AI ANALYSIS: Final suggestions array:',
                JSON.stringify(limitedSuggestions, null, 2),
            )

            return limitedSuggestions
        } catch (error) {
            logger.error('❌ AI ANALYSIS: AI analysis failed:', error)
            logger.error(
                '❌ AI ANALYSIS: Error details:',
                error instanceof Error ? error.stack : 'Unknown error type',
            )
            return []
        }
    }

    /**
     * Perform Google Custom Search for context
     */
    private async performGoogleSearch(
        url: string,
    ): Promise<GoogleSearchResult[]> {
        logger.log('🔍 GOOGLE SEARCH: Starting Google search for URL:', url)
        const aggregatedResults: GoogleSearchResult[] = []

        try {
            const languages = ['lang_en', 'lang_zh-TW']
            for (const lr of languages) {
                const urlObj = new URL(url)
                const domain = urlObj.hostname
                const path = urlObj.pathname.slice(1, 50) // first 50 chars of path

                logger.log(
                    '🔍 GOOGLE SEARCH: Parsed URL - domain:',
                    domain,
                    'path:',
                    path,
                    'language:',
                    lr,
                )

                // Create smart search query
                const query = `site:${domain} ${path}`.trim()
                logger.log('🔍 GOOGLE SEARCH: Generated search query:', query)

                // Extract hl param: 'lang_en' -> 'en', 'lang_zh-TW' -> 'zh-TW'
                const hl = lr.replace('lang_', '')
                const searchUrl = `https://customsearch.googleapis.com/customsearch/v1?key=${this.config.googleSearchApiKey}&gl=HK&cx=${this.config.googleSearchEngineId}&q=${encodeURIComponent(query)}&num=3&hl=${hl}&lr=${lr}`
                logger.log(
                    '🔍 GOOGLE SEARCH: Making API request to Google Custom Search',
                )

                const response = await fetch(searchUrl, {
                    signal: AbortSignal.timeout(this.config.timeout),
                })

                logger.log(
                    '🔍 GOOGLE SEARCH: API response status:',
                    response.status,
                )

                if (!response.ok) {
                    logger.log(
                        '🔍 GOOGLE SEARCH: API request failed with status:',
                        response.status,
                    )

                    // Log response body for debugging
                    try {
                        const errorBody = await response.text()
                        logger.log(
                            '🔍 GOOGLE SEARCH: Error response body:',
                            errorBody.substring(0, 500),
                        )
                    } catch (bodyError) {
                        logger.log(
                            '🔍 GOOGLE SEARCH: Could not read error response body:',
                            bodyError,
                        )
                    }

                    throw new Error(
                        `Google Search API error: ${response.status}`,
                    )
                }

                const data = await response.json()
                logger.log(
                    '🔍 GOOGLE SEARCH: Full API response body:',
                    JSON.stringify(data, null, 2),
                )

                const results = data.items || []
                logger.log(
                    '🔍 GOOGLE SEARCH: Successfully retrieved',
                    results.length,
                    'search results',
                )

                if (results.length > 0) {
                    logger.log(
                        '🔍 GOOGLE SEARCH: First result title:',
                        results[0].title?.substring(0, 50),
                    )
                }

                aggregatedResults.push(...results)
            }
            return aggregatedResults
        } catch (error) {
            logger.error('❌ GOOGLE SEARCH: Google search failed:', error)
            logger.error(
                '❌ GOOGLE SEARCH: Error details:',
                error instanceof Error ? error.message : 'Unknown error',
            )
            logger.log(
                '🔍 GOOGLE SEARCH: Returning empty results, continuing without search context',
            )
            return [] // Continue without search results
        }
    }

    /**
     * Fetch HTML content from the URL
     */
    private async fetchHtmlContent(url: string): Promise<string> {
        logger.log('🌐 HTML FETCH: Starting HTML content fetch for URL:', url)

        try {
            logger.log(
                '🌐 HTML FETCH: Making HTTP request with timeout:',
                this.config.timeout,
                'ms',
            )

            logger.log('🌐 HTML FETCH: Request headers:', {
                'User-Agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
            })

            const response = await fetch(url, {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
                },
                signal: AbortSignal.timeout(this.config.timeout),
            })

            logger.log(
                '🌐 HTML FETCH: HTTP response status:',
                response.status,
                'content-type:',
                response.headers.get('content-type'),
            )

            if (!response.ok) {
                logger.log(
                    '🌐 HTML FETCH: HTTP request failed with status:',
                    response.status,
                )

                // Log response body for debugging
                try {
                    const errorBody = await response.text()
                    logger.log(
                        '🌐 HTML FETCH: Error response body:',
                        errorBody.substring(0, 500),
                    )
                } catch (bodyError) {
                    logger.log(
                        '🌐 HTML FETCH: Could not read error response body:',
                        bodyError,
                    )
                }

                throw new Error(`Failed to fetch HTML: ${response.status}`)
            }

            const html = await response.text()
            logger.log(
                '🌐 HTML FETCH: Full response body (first 1000 chars):',
                html.substring(0, 1000),
            )

            const limitedHtml = html.slice(0, 50000) // Limit to first 50KB

            logger.log('🌐 HTML FETCH: Successfully fetched HTML content')
            logger.log(
                '🌐 HTML FETCH: Original HTML length:',
                html.length,
                'characters',
            )
            logger.log(
                '🌐 HTML FETCH: Limited to:',
                limitedHtml.length,
                'characters',
            )
            logger.log(
                '🌐 HTML FETCH: HTML preview (first 200 chars):',
                limitedHtml.substring(0, 200),
            )

            return limitedHtml
        } catch (error) {
            logger.error('❌ HTML FETCH: HTML fetch failed:', error)
            logger.error(
                '❌ HTML FETCH: Error details:',
                error instanceof Error ? error.message : 'Unknown error',
            )
            logger.log(
                '🌐 HTML FETCH: Returning empty string, continuing without HTML context',
            )
            return ''
        }
    }

    /**
     * Map language code to display name
     */
    private getLanguageDisplayName(language?: string): string | undefined {
        if (!language) return undefined
        const languageNames: Record<string, string | undefined> = {
            en: 'English',
            'zh-TW': '繁體中文',
            'zh-HK': '繁體中文 (HK)',
            'zh-Hant': '繁體中文',
            'zh-CN': '简体中文',
            'zh-Hans': '简体中文',
            zh: '中文',
            ja: '日本語',
            ko: '한국어',
            es: 'Español',
            fr: 'Français',
            de: 'Deutsch',
            pt: 'Português',
            ru: 'Русский',
            th: 'ไทย',
            vi: 'Tiếng Việt',
            original: 'Original',
            unknown: undefined,
        }
        return languageNames[language] ?? language
    }

    /**
     * Infer platform from URL and context
     */
    private async inferPlatform(
        url: string,
        title: string,
        platform: string,
    ): Promise<string> {
        logger.log('🔍 PLATFORM INFERENCE: Inferring platform for URL:', url)
        logger.log('🔍 PLATFORM INFERENCE: Title:', title.substring(0, 50))

        if (platform !== 'unknown') {
            logger.log(
                '🔍 PLATFORM INFERENCE: Using URL-detected platform:',
                platform,
            )
            return platform
        }

        logger.log(
            '🔍 PLATFORM INFERENCE: No platform detected, returning unknown',
        )
        return 'unknown'
    }

    /**
     * Infer thumbnail URL from available sources, prioritizing meta tags
     */
    private inferThumbnail(
        url: string,
        _htmlContent: string,
        searchResults: GoogleSearchResult[],
        extractedMetadata: HtmlMetadata,
    ): string | undefined {
        logger.log('🖼 THUMBNAIL INFERENCE: Inferring thumbnail for URL:', url)

        // PRIORITY 1: Meta tag thumbnails (og:image, twitter:image)
        const metaThumbnail =
            extractedMetadata.ogImage || extractedMetadata.twitterImage
        if (metaThumbnail) {
            logger.log(
                '🖼 THUMBNAIL INFERENCE: Using meta tag thumbnail:',
                metaThumbnail,
            )
            return metaThumbnail
        }

        logger.log(
            '🖼 THUMBNAIL INFERENCE: No meta tag thumbnails found, checking',
            searchResults.length,
            'search results for images',
        )

        // PRIORITY 2: Search results
        for (const result of searchResults) {
            if (result.pagemap?.cse_image?.[0]?.src) {
                const thumbnailUrl = result.pagemap.cse_image[0].src
                logger.log(
                    '🖼 THUMBNAIL INFERENCE: Found thumbnail in search result:',
                    thumbnailUrl,
                )
                return thumbnailUrl
            }
        }

        logger.log('🖼 THUMBNAIL INFERENCE: No thumbnail found')
        return undefined
    }

    /**
     * Get cached results if available and not expired
     */
    private async getCachedResult(
        url: string,
    ): Promise<MetadataCacheEntry | null> {
        logger.log('💾 CACHE LOOKUP: Checking cache for URL:', url)

        try {
            logger.log('💾 CACHE LOOKUP: Querying database for cached entry')
            const result = await db
                .select()
                .from(aiMetadataCache)
                .where(eq(aiMetadataCache.url, url))
                .limit(1)

            logger.log(
                '💾 CACHE LOOKUP: Database query returned',
                result.length,
                'results',
            )

            if (result.length === 0) {
                logger.log('💾 CACHE LOOKUP: No cached entry found')
                return null
            }

            const cache = result[0]
            const expiresAt = new Date(cache.expiresAt)
            const now = new Date()

            logger.log('💾 CACHE LOOKUP: Cache entry found')
            logger.log(
                '💾 CACHE LOOKUP: Cache expires at:',
                expiresAt.toISOString(),
            )
            logger.log('💾 CACHE LOOKUP: Current time:', now.toISOString())
            logger.log('💾 CACHE LOOKUP: Cache expired?', expiresAt < now)

            if (expiresAt < now) {
                // Expired, clean up
                logger.log('💾 CACHE LOOKUP: Cache expired, deleting entry')
                await db
                    .delete(aiMetadataCache)
                    .where(eq(aiMetadataCache.url, url))
                logger.log('💾 CACHE LOOKUP: Expired cache entry deleted')
                return null
            }

            logger.log('💾 CACHE LOOKUP: Cache valid, parsing cached data')
            const cachedEntry = {
                id: cache.id,
                url: cache.url,
                searchResults: cache.searchResults as GoogleSearchResult[],
                extractedMetadata: cache.extractedMetadata as HtmlMetadata,
                aiAnalysis: cache.aiAnalysis as MetadataSuggestion[],
                confidenceScore: Number(cache.confidenceScore),
                createdAt: cache.createdAt
                    ? new Date(cache.createdAt)
                    : new Date(),
                expiresAt: cache.expiresAt
                    ? new Date(cache.expiresAt)
                    : new Date(),
            }

            logger.log(
                '💾 CACHE LOOKUP: Successfully parsed cached entry with',
                cachedEntry.aiAnalysis?.length || 0,
                'suggestions',
            )
            return cachedEntry
        } catch (error) {
            logger.error('❌ CACHE LOOKUP: Cache lookup failed:', error)
            logger.error(
                '❌ CACHE LOOKUP: Error details:',
                error instanceof Error ? error.stack : 'Unknown error',
            )
            logger.log('💾 CACHE LOOKUP: Returning null due to cache error')
            return null
        }
    }

    /**
     * Cache AI analysis results
     */
    private async cacheResults(
        url: string,
        searchResults: GoogleSearchResult[],
        htmlContent: string,
        suggestions: MetadataSuggestion[],
    ): Promise<void> {
        if (process.env.DISABLE_METADATA_CACHE === 'true') {
            logger.log(
                '💾 CACHE STORAGE: Caching disabled, skipping cache storage',
            )
            return
        }

        logger.log('💾 CACHE STORAGE: Starting cache storage for URL:', url)

        try {
            logger.log(
                '💾 CACHE STORAGE: Calculating average confidence from',
                suggestions.length,
                'suggestions',
            )
            const avgConfidence =
                suggestions.reduce((sum, s) => sum + s.confidence, 0) /
                suggestions.length
            logger.log('💾 CACHE STORAGE: Average confidence:', avgConfidence)

            logger.log('💾 CACHE STORAGE: Extracting metadata for caching')
            const extractedMetadata = await MetascraperService.extractMetadata(
                htmlContent,
                url,
            )
            logger.log('💾 CACHE STORAGE: Metadata extracted for cache:', {
                hasTitle: !!extractedMetadata.title,
                hasDescription: !!extractedMetadata.description,
            })

            const expiresAt = new Date(Date.now() + this.config.cacheTtl)
            logger.log(
                '💾 CACHE STORAGE: Cache will expire at:',
                expiresAt.toISOString(),
            )

            const cacheData = {
                url,
                searchResults,
                extractedMetadata,
                aiAnalysis: suggestions,
                confidenceScore: avgConfidence.toString(),
                expiresAt: expiresAt,
            }
            logger.log(
                '💾 CACHE STORAGE: Data being cached:',
                JSON.stringify(cacheData, null, 2),
            )

            logger.log('💾 CACHE STORAGE: Inserting into database')
            await db.insert(aiMetadataCache).values(cacheData)

            logger.log('💾 CACHE STORAGE: Successfully cached results')
        } catch (error) {
            logger.error('❌ CACHE STORAGE: Cache storage failed:', error)
            logger.error(
                '❌ CACHE STORAGE: Error details:',
                error instanceof Error ? error.stack : 'Unknown error',
            )
            logger.log(
                '💾 CACHE STORAGE: Continuing without caching (non-blocking error)',
            )
            // Don't fail the whole operation for cache issues
        }
    }
}

// Export singleton instance
const aiMetadataConfig: AIMetadataConfig = {
    googleSearchApiKey: process.env.GOOGLE_SEARCH_API_KEY!,
    googleSearchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID!,
    openRouterApiKey: process.env.OPENROUTER_API_KEY!,
    cacheTtl: Number(process.env.METADATA_CACHE_TTL) || 7 * 24 * 60 * 60 * 1000, // 7 days
    timeout: Number(process.env.AI_ANALYSIS_TIMEOUT) || 15000, // 15 seconds
}

export const aiMetadataService = new AIMetadataService(aiMetadataConfig)
