'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { NavigationTabs } from '@/components/navigation-tabs'
import { UrlInputSection } from '@/components/url-input-section'
import { FormLayout } from '@/components/video-form'
import { PreviewCard } from '@/components/video-preview'
import { useAIMetadataFetching } from '@/hooks/use-ai-metadata-fetching'
import { useUrlValidation } from '@/hooks/use-url-validation'
import type { PlatformSuggestion } from '@/lib/services/ai-service'
import type { Tag } from '@/types/tag'
import { videoSchema, type VideoFormData } from '@/types/form'

export default function Home() {
    // URL validation hook
    const urlValidation = useUrlValidation()

    // AI Metadata fetching hook
    const aiMetadata = useAIMetadataFetching(urlValidation.urlValidationResult)

    // Selected tags state for preview display
    const [selectedTags, setSelectedTags] = useState<Tag[]>([])

    // Global reset function
    const reset = () => {
        urlValidation.setUrl('')
    }

    // Manual mode state
    const [manualMode, setManualModeRaw] = useState(false)

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    // Platform detection state (moved from FormLayout)
    const [_platformSuggestions, setPlatformSuggestions] = useState<
        PlatformSuggestion[]
    >([])
    const [platformDiscoveryProcessed, setPlatformDiscoveryProcessed] =
        useState(false)

    const [mode, setMode] = useState<'input' | 'form'>('input')

    // Full loading condition for mode transition
    const isReadyForForm =
        urlValidation.urlValidationResult?.validated &&
        urlValidation.urlValidationResult.isValid &&
        aiMetadata.fetchDone &&
        (urlValidation.urlValidationResult.platform !== 'unknown' ||
            platformDiscoveryProcessed)

    // Initialize RHF form
    const form = useForm<VideoFormData>({
        resolver: zodResolver(videoSchema),
        defaultValues: {
            title: '',
            thumbnailUrl: '',
            tags: [],
        },
    })

    // Platform detection (moved from FormLayout)
    useEffect(() => {
        const parsed = urlValidation.urlValidationResult
        if (
            !parsed ||
            !parsed.validated ||
            !parsed.isValid ||
            parsed.platform !== 'unknown'
        )
            return

        fetch('/api/platforms/discover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: parsed.url }),
        })
            .then((response) => {
                if (!response.ok)
                    throw new Error(`API request failed: ${response.status}`)
                return response.json()
            })
            .then((data) => {
                const suggestion: PlatformSuggestion = data.suggestion
                if (suggestion.confidence > 0.3) {
                    setPlatformSuggestions([suggestion])
                }
            })
            .catch((error) => {
                console.error('Platform detection error:', error)
            })
            .finally(() => {
                setPlatformDiscoveryProcessed(true)
            })
    }, [urlValidation.urlValidationResult])

    // Mode transition: Input → Form when all async operations complete
    useEffect(() => {
        console.log(isReadyForForm)
        if (isReadyForForm && mode === 'input') {
            setMode('form')
        }
    }, [isReadyForForm, mode])

    // Reset mode to input when URL becomes invalid
    useEffect(() => {
        if (
            !urlValidation ||
            !urlValidation.urlValidationResult?.isValid ||
            !urlValidation.urlValidationResult?.validated
        ) {
            setMode('input')
        }
    }, [urlValidation.urlValidationResult, urlValidation])

    // Update form when AI metadata changes (only if not in manual mode)
    useEffect(() => {
        if (!manualMode && aiMetadata.selectedSuggestion) {
            form.setValue('title', aiMetadata.selectedSuggestion.title)
            form.setValue(
                'thumbnailUrl',
                aiMetadata.selectedSuggestion.thumbnailUrl || '',
            )
        }
    }, [aiMetadata.selectedSuggestion, manualMode, form])

    // Watch form values
    const watchedTitle = useWatch({ control: form.control, name: 'title' })
    const watchedThumbnailUrl = useWatch({
        control: form.control,
        name: 'thumbnailUrl',
    })
    const watchedTags = useWatch({ control: form.control, name: 'tags' })

    // Smart mode transitions for manual mode
    const setManualMode = useCallback(
        (mode: boolean) => {
            setManualModeRaw(mode)

            if (mode) {
                // Switching to manual: preserve current inputs (AI values if not set)
                const currentTitle =
                    watchedTitle || aiMetadata.selectedSuggestion?.title || ''
                const currentThumbnail =
                    watchedThumbnailUrl ||
                    aiMetadata.selectedSuggestion?.thumbnailUrl ||
                    ''
                form.setValue('title', currentTitle)
                form.setValue('thumbnailUrl', currentThumbnail)
            } else {
                // Switching to auto: clear manual inputs if they match AI suggestion
                if (watchedTitle === aiMetadata.selectedSuggestion?.title)
                    form.setValue('title', '')
                if (
                    watchedThumbnailUrl ===
                    aiMetadata.selectedSuggestion?.thumbnailUrl
                )
                    form.setValue('thumbnailUrl', '')
            }

            setSubmitError(null)
        },
        [
            aiMetadata.selectedSuggestion,
            watchedTitle,
            watchedThumbnailUrl,
            form,
        ],
    )

    // Submission handler using RHF
    const onSubmit = form.handleSubmit(async (data: VideoFormData) => {
        if (!urlValidation.urlValidationResult?.isValid) return

        setIsSubmitting(true)
        setSubmitError(null)

        try {
            const videoData = {
                url: urlValidation.urlValidationResult.url,
                title: data.title,
                platform:
                    aiMetadata.selectedSuggestion?.platform ||
                    urlValidation.urlValidationResult.platform,
                thumbnailUrl: data.thumbnailUrl || null,
                tagIds: data.tags,
            }

            const response = await fetch('/api/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(videoData),
            })

            console.log(
                '📥 API Response:',
                response.status,
                response.statusText,
            )

            if (!response.ok) {
                if (response.status === 409) {
                    const errorData = await response.json()
                    setSubmitError(errorData.error || 'Video already exists')
                } else {
                    setSubmitError('Failed to add video')
                }
            } else {
                reset() // Reset URL and global state
                form.reset() // Reset form
                toast.success('Video added successfully!')
            }
        } catch (error) {
            console.error('Error adding video:', error)
            setSubmitError('Failed to add video')
        } finally {
            setIsSubmitting(false)
        }
    })

    if (
        urlValidation.validating ||
        (!isReadyForForm && urlValidation.urlValidationResult?.isValid)
    ) {
        return (
            <div className='bg-background text-foreground'>
                <NavigationTabs />
                <main className='min-h-screen pt-4 sm:pt-16 pb-20 container mx-auto px-4 max-w-6xl flex items-center justify-center'>
                    <div className='text-center'>
                        <div className='text-lg text-gray-500 dark:text-gray-400'>
                            Loading...
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <FormProvider {...form}>
            <div className='bg-background text-foreground'>
                <NavigationTabs />

                <main className='min-w-screen min-h-screen pt-16 pb-20 container mx-auto px-4 flex items-center justify-center'>
                    {mode === 'input' ? (
                        <UrlInputSection
                            value={urlValidation.urlValidationResult?.url}
                            onChange={urlValidation.setUrl}
                            isValid={urlValidation.urlValidationResult?.isValid}
                            error={urlValidation.urlValidationResult?.error}
                            disabled={isSubmitting}
                        />
                    ) : (
                        <div className='w-full max-w-7xl'>
                            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
                                <div>
                                    <FormLayout
                                        handleSubmit={onSubmit}
                                        isSubmitting={isSubmitting}
                                        submitError={submitError}
                                        // Unified suggestions
                                        suggestions={{
                                            ai: aiMetadata.suggestions,
                                            platform: _platformSuggestions,
                                        }}
                                        selectedSuggestion={
                                            aiMetadata.selectedSuggestion
                                        }
                                        onSuggestionSelect={
                                            aiMetadata.setSelectedSuggestion
                                        }
                                        aiMetadataError={aiMetadata.error}
                                        onManualEdit={() =>
                                            setManualMode(!manualMode)
                                        }
                                        onPlatformCreated={(platform) => {
                                            // Handle platform creation
                                            console.log(
                                                'Platform created:',
                                                platform,
                                            )
                                        }}
                                        // Tag props
                                        onSelectedTagsChange={setSelectedTags}
                                        onReset={reset}
                                    />
                                </div>
                                <div>
                                    <PreviewCard
                                        video={{
                                            id: 0,
                                            url:
                                                urlValidation
                                                    .urlValidationResult?.url ??
                                                'Invalid',
                                            title: manualMode
                                                ? watchedTitle || null
                                                : aiMetadata.selectedSuggestion
                                                      ?.title || null,
                                            platform:
                                                aiMetadata.selectedSuggestion
                                                    ?.platform ||
                                                urlValidation
                                                    .urlValidationResult
                                                    ?.platform ||
                                                'unknown',
                                            thumbnailUrl: manualMode
                                                ? watchedThumbnailUrl || null
                                                : aiMetadata.selectedSuggestion
                                                      ?.thumbnailUrl || null,
                                            isWatched: false,
                                            tags: selectedTags,
                                            metadata:
                                                aiMetadata.selectedSuggestion
                                                    ? {
                                                          title: aiMetadata
                                                              .selectedSuggestion
                                                              .title,
                                                          thumbnailUrl:
                                                              aiMetadata
                                                                  .selectedSuggestion
                                                                  .thumbnailUrl ||
                                                              null,
                                                      }
                                                    : null,
                                            error:
                                                aiMetadata.error || undefined,
                                        }}
                                        showActions={false}
                                        onToggleManual={() =>
                                            setManualMode(!manualMode)
                                        }
                                        showBackground={false}
                                        manualMode={manualMode}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </FormProvider>
    )
}
