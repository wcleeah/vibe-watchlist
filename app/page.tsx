'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { NavigationTabs } from '@/components/navigation-tabs'
import { UrlInputSection } from '@/components/url-input-section'
import { FormLayout } from '@/components/video-form'
import { FormPreview } from '@/components/video-form/form-preview'
import { useAIMetadataFetching } from '@/hooks/use-ai-metadata-fetching'
import { usePlatformDiscovery } from '@/hooks/use-platform-discovery'
import { useUrlValidation } from '@/hooks/use-url-validation'
import { useVideoSubmission } from '@/hooks/use-video-submission'
import { type VideoFormData, videoSchema } from '@/types/form'
import type { ContentMode } from '@/types/series'

export default function Home() {
    // Initialize RHF form
    const form = useForm<VideoFormData>({
        resolver: zodResolver(videoSchema),
        defaultValues: {
            title: '',
            thumbnailUrl: '',
            platform: 'unknown',
        },
    })
    const { setValue } = form

    // Hooks
    const urlValidation = useUrlValidation()
    const aiMetadata = useAIMetadataFetching(urlValidation.urlValidationResult)
    const platformDiscovery = usePlatformDiscovery(
        urlValidation.urlValidationResult,
    )
    const submission = useVideoSubmission(
        form,
        urlValidation.urlValidationResult,
        {
            onSuccess: () => handleReset(),
        },
    )

    // UI state
    const [mode, setMode] = useState<'input' | 'form'>('input')

    // Determine default mode based on URL type
    const defaultMode: ContentMode = urlValidation.urlValidationResult
        ?.isPlaylist
        ? 'playlist'
        : 'video'

    // Ready check
    const isReadyForForm =
        urlValidation.urlValidationResult?.validated &&
        urlValidation.urlValidationResult.isValid &&
        aiMetadata.fetchDone &&
        (urlValidation.urlValidationResult.platform !== 'unknown' ||
            platformDiscovery.isProcessed)

    // Sync URL to form
    useEffect(() => {
        if (
            urlValidation.urlValidationResult?.isValid &&
            urlValidation.urlValidationResult.validated
        ) {
            setValue('url', urlValidation.urlValidationResult.url)
        }
    }, [urlValidation.urlValidationResult, setValue])

    // Auto-populate form with AI suggestions
    useEffect(() => {
        if (aiMetadata.fetchDone && aiMetadata.suggestions.length > 0) {
            const suggestion = aiMetadata.suggestions[0]
            setValue('platform', suggestion.platform)
            setValue('thumbnailUrl', suggestion.thumbnailUrl)
            setValue('title', suggestion.title)
        }
    }, [aiMetadata.fetchDone, aiMetadata.suggestions, setValue])

    // Transition to form mode when ready
    useEffect(() => {
        if (isReadyForForm && mode === 'input') {
            setMode('form')
        }
    }, [isReadyForForm, mode])

    // Reset to input mode when URL becomes invalid
    useEffect(() => {
        if (
            !urlValidation.urlValidationResult?.isValid ||
            !urlValidation.urlValidationResult?.validated
        ) {
            setMode('input')
        }
    }, [urlValidation.urlValidationResult])

    // Reset handler
    const handleReset = async (clearCache: boolean = false) => {
        const currentUrl = urlValidation.urlValidationResult?.url

        if (clearCache && currentUrl) {
            try {
                fetch(`/api/cache?url=${encodeURIComponent(currentUrl)}`, {
                    method: 'DELETE',
                })
            } catch {
                // Failed to clear cache - not critical
            }
        }

        urlValidation.unsetUrl()
        platformDiscovery.dismiss()
        submission.resetError()
        form.reset()
    }

    // Loading state
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
            <form onSubmit={form.handleSubmit(submission.submit)}>
                <div className='bg-background text-foreground'>
                    <NavigationTabs />

                    <main className='min-w-screen min-h-screen pt-16 pb-20 container mx-auto px-4 flex items-center justify-center'>
                        {mode === 'input' ? (
                            <UrlInputSection
                                value={urlValidation.urlValidationResult?.url}
                                onChange={urlValidation.setUrl}
                                isValid={
                                    urlValidation.urlValidationResult?.isValid
                                }
                                error={urlValidation.urlValidationResult?.error}
                                disabled={submission.isSubmitting}
                            />
                        ) : (
                            <div className='w-full max-w-7xl'>
                                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
                                    <div>
                                        <FormLayout
                                            isSubmitting={
                                                submission.isSubmitting
                                            }
                                            submitError={submission.error}
                                            aiSuggestions={
                                                aiMetadata.suggestions
                                            }
                                            platformSuggestions={
                                                platformDiscovery.suggestions
                                            }
                                            aiMetadataError={aiMetadata.error}
                                            onReset={() => handleReset(true)}
                                            onPlatformSuggestionsDismiss={
                                                platformDiscovery.dismiss
                                            }
                                            defaultMode={defaultMode}
                                            isPlaylist={
                                                urlValidation
                                                    .urlValidationResult
                                                    ?.isPlaylist
                                            }
                                        />
                                    </div>
                                    <div>
                                        <FormPreview />
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </form>
        </FormProvider>
    )
}
