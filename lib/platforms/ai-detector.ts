import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { platformConfigs } from '@/lib/db/schema'
import { aiService, type PlatformSuggestion } from '@/lib/services/ai-service'

export interface DetectionResult {
    platform: string
    confidence: number
    config?: {
        platformId: string
        name: string
        displayName: string
        patterns: string[]
        extractor: string | null
        color: string | null
        icon: string | null
        enabled: boolean | null
        isPreset: boolean | null
        addedBy: string | null
        confidenceScore: string | null
    }
    isKnown: boolean
    source: 'preset' | 'ai' | 'unknown'
}

interface PresetPlatform {
    id: number
    platformId: string
    name: string
    displayName: string
    patterns: string[]
    extractor: string | null
    color: string | null
    icon: string | null
    enabled: boolean | null
    isPreset: boolean | null
    addedBy: string | null
    confidenceScore: string | null
    metadata?: unknown
    createdAt: Date | null
    updatedAt: Date | null
}

export class AIDetector {
    private presetPlatforms: Map<string, PresetPlatform> = new Map()

    async initialize() {
        try {
            // Load preset platforms from database
            const presets = await db
                .select()
                .from(platformConfigs)
                .where(eq(platformConfigs.isPreset, true))

            this.presetPlatforms.clear()
            presets.forEach((platform) => {
                this.presetPlatforms.set(platform.name, platform)
                // Also map by patterns for faster lookup
                platform.patterns.forEach((pattern: string) => {
                    this.presetPlatforms.set(pattern, platform)
                })
            })

            console.log(
                `Loaded ${presets.length} preset platforms for AI detection`,
            )
        } catch (error) {
            console.error('Failed to initialize AI detector:', error)
        }
    }

    async detectAndSuggest(url: string): Promise<DetectionResult | null> {
        try {
            // First try preset platform detection
            const presetResult = this.detectPresetPlatform(url)
            if (presetResult) {
                return {
                    ...presetResult,
                    isKnown: true,
                    source: 'preset',
                }
            }

            // If no preset match, try AI detection
            const aiSuggestion = await aiService.detectPlatform(url)

            if (aiSuggestion && aiSuggestion.confidence > 0.6) {
                // Check if AI suggestion matches an existing platform
                const existingPlatform = await db
                    .select()
                    .from(platformConfigs)
                    .where(
                        eq(platformConfigs.platformId, aiSuggestion.platform),
                    )
                    .limit(1)

                if (existingPlatform.length > 0) {
                    return {
                        platform: aiSuggestion.platform,
                        confidence: aiSuggestion.confidence,
                        config: existingPlatform[0],
                        isKnown: true,
                        source: 'ai',
                    }
                }

                // AI detected a new platform
                return {
                    platform: aiSuggestion.platform,
                    confidence: aiSuggestion.confidence,
                    config: {
                        platformId: aiSuggestion.platform,
                        name: aiSuggestion.platform,
                        displayName:
                            aiSuggestion.platform.charAt(0).toUpperCase() +
                            aiSuggestion.platform.slice(1),
                        patterns: aiSuggestion.patterns,
                        extractor: 'ai',
                        color: aiSuggestion.color,
                        icon: aiSuggestion.icon,
                        enabled: true,
                        isPreset: false,
                        addedBy: 'ai',
                        confidenceScore: aiSuggestion.confidence.toString(),
                    },
                    isKnown: false,
                    source: 'ai',
                }
            }

            return null
        } catch (error) {
            console.error('Platform detection failed:', error)
            return null
        }
    }

    private detectPresetPlatform(url: string): DetectionResult | null {
        try {
            const urlObj = new URL(url)
            const hostname = urlObj.hostname.toLowerCase()

            // Check for exact hostname match
            if (this.presetPlatforms.has(hostname)) {
                const config = this.presetPlatforms.get(hostname)
                if (config) {
                    return {
                        platform: config.name,
                        confidence: 1.0,
                        config,
                        isKnown: true,
                        source: 'preset',
                    }
                }
            }

            // Check for pattern matches
            for (const config of this.presetPlatforms.values()) {
                if (config.patterns && Array.isArray(config.patterns)) {
                    for (const pattern of config.patterns) {
                        if (
                            hostname.includes(pattern) ||
                            url.includes(pattern)
                        ) {
                            return {
                                platform: config.name,
                                confidence: 0.9,
                                config,
                                isKnown: true,
                                source: 'preset',
                            }
                        }
                    }
                }
            }

            return null
        } catch (error) {
            console.error('Preset platform detection failed:', error)
            return null
        }
    }

    async registerNewPlatform(
        suggestion: PlatformSuggestion,
    ): Promise<boolean> {
        try {
            // Check if platform already exists
            const existing = await db
                .select()
                .from(platformConfigs)
                .where(eq(platformConfigs.platformId, suggestion.platform))
                .limit(1)

            if (existing.length > 0) {
                console.log(`Platform ${suggestion.platform} already exists`)
                return false
            }

            // Register new platform
            await db.insert(platformConfigs).values({
                platformId: suggestion.platform,
                name: suggestion.platform,
                displayName:
                    suggestion.platform.charAt(0).toUpperCase() +
                    suggestion.platform.slice(1),
                patterns: suggestion.patterns,
                extractor: 'ai',
                color: suggestion.color,
                icon: suggestion.icon,
                enabled: true,
                isPreset: false,
                addedBy: 'ai',
                confidenceScore: suggestion.confidence.toString(),
                metadata: {
                    detectedAt: new Date().toISOString(),
                    source: 'ai_detection',
                },
            })

            // Reload presets to include new platform
            await this.initialize()

            console.log(`Registered new platform: ${suggestion.platform}`)
            return true
        } catch (error) {
            console.error('Failed to register new platform:', error)
            return false
        }
    }

    async getAllPlatforms() {
        try {
            return await db
                .select()
                .from(platformConfigs)
                .where(eq(platformConfigs.enabled, true))
        } catch (error) {
            console.error('Failed to get platforms:', error)
            return []
        }
    }
}

export const aiDetector = new AIDetector()
