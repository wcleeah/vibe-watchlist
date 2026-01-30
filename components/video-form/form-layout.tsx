'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import type { PlatformSuggestion } from '@/lib/services/ai-service'
import type { MetadataSuggestion } from '@/lib/types/ai-metadata'
import type { VideoFormData } from '@/types/form'
import type { ContentMode } from '@/types/series'
import { ModeToggle } from './mode-toggle'
import { PlaylistForm } from './modes/playlist-form'
import { SeriesForm } from './modes/series-form'
import { VideoForm } from './modes/video-form'
import { PlatformSuggestions } from './platform-suggestions'

interface FormLayoutProps {
    isSubmitting: boolean
    submitError: string | null
    aiSuggestions: MetadataSuggestion[]
    platformSuggestions: PlatformSuggestion[]
    aiMetadataError?: string | null
    onReset: () => void
    onPlatformSuggestionsDismiss?: () => void
    defaultMode?: ContentMode
    isPlaylist?: boolean
    onSeriesCreated?: () => void
    onPlaylistImported?: () => void
}

export function FormLayout({
    isSubmitting,
    submitError,
    aiSuggestions,
    platformSuggestions,
    aiMetadataError,
    onReset,
    onPlatformSuggestionsDismiss,
    defaultMode = 'video',
    isPlaylist = false,
    onSeriesCreated,
    onPlaylistImported,
}: FormLayoutProps) {
    const [mode, setMode] = useState<ContentMode>(defaultMode)
    const { setValue } = useFormContext<VideoFormData>()

    // Platform suggestion handlers
    const handleAcceptPlatform = async (suggestion: PlatformSuggestion) => {
        try {
            const response = await fetch('/api/platforms/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platformId: suggestion.platform,
                    name: suggestion.platform,
                    displayName:
                        suggestion.platform.charAt(0).toUpperCase() +
                        suggestion.platform.slice(1),
                    patterns: suggestion.patterns,
                    color: suggestion.color,
                    icon: suggestion.icon,
                    confidenceScore: suggestion.confidence,
                }),
            })

            if (response.ok) {
                const result = await response.json()
                setValue('platform', result.platform.platformId)
                onPlatformSuggestionsDismiss?.()
            }
        } catch {
            // Silently handle platform creation errors
        }
    }

    const handleRejectPlatform = () => {
        setValue('platform', 'unknown')
        onPlatformSuggestionsDismiss?.()
    }

    return (
        <div className='space-y-6'>
            <div className='text-center mb-4'>
                <h2 className='text-xl font-semibold'>
                    Add{' '}
                    {mode === 'video'
                        ? 'Video'
                        : mode === 'series'
                          ? 'Series'
                          : 'Playlist'}
                </h2>
            </div>

            <ModeToggle
                mode={mode}
                onChange={setMode}
                disabled={isSubmitting}
                disablePlaylist={!isPlaylist}
            />

            {/* Platform Suggestions - Only for video/series modes */}
            {mode !== 'playlist' && platformSuggestions.length > 0 && (
                <PlatformSuggestions
                    suggestions={platformSuggestions}
                    onAccept={handleAcceptPlatform}
                    onReject={handleRejectPlatform}
                    onDismiss={onPlatformSuggestionsDismiss}
                />
            )}

            {/* Mode-specific forms */}
            {mode === 'video' && (
                <VideoForm
                    suggestions={aiSuggestions}
                    error={aiMetadataError}
                    isSubmitting={isSubmitting}
                    submitError={submitError}
                    onReset={onReset}
                />
            )}

            {mode === 'series' && (
                <SeriesForm
                    suggestions={aiSuggestions}
                    error={aiMetadataError}
                    onReset={onReset}
                    onCreated={onSeriesCreated}
                />
            )}

            {mode === 'playlist' && (
                <PlaylistForm
                    onReset={onReset}
                    onImported={onPlaylistImported}
                />
            )}
        </div>
    )
}
