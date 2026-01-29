'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { NavigationTabs } from '@/components/navigation-tabs'
import { UrlInputSection } from '@/components/url-input-section'
import { FormLayout } from '@/components/video-form'
import { PreviewCard } from '@/components/video-preview/preview-card'
import { useAIMetadataFetching } from '@/hooks/use-ai-metadata-fetching'
import { useUrlValidation } from '@/hooks/use-url-validation'
import type { PlatformSuggestion } from '@/lib/services/ai-service'
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

    const urlValidation = useUrlValidation()
    const aiMetadata = useAIMetadataFetching(urlValidation.urlValidationResult)
    const [mode, setMode] = useState<'input' | 'form'>('input')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [platformSuggestions, setPlatformSuggestions] = useState<
        PlatformSuggestion[]
    >([])
    const [platformDiscoveryProcessed, setPlatformDiscoveryProcessed] =
        useState(false)

    // Determine default mode based on URL type
    const defaultMode: ContentMode = urlValidation.urlValidationResult
        ?.isPlaylist
        ? 'playlist'
        : 'video'

    const isReadyForForm =
        urlValidation.urlValidationResult?.validated &&
        urlValidation.urlValidationResult.isValid &&
        aiMetadata.fetchDone &&
        (urlValidation.urlValidationResult.platform !== 'unknown' ||
            platformDiscoveryProcessed)

    useEffect(() => {
        if (
            urlValidation.urlValidationResult?.isValid &&
            urlValidation.urlValidationResult.validated
        ) {
            setValue('url', urlValidation.urlValidationResult.url)
        }
    }, [urlValidation.urlValidationResult, setValue])

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

    useEffect(() => {
        if (isReadyForForm && mode === 'input') {
            setMode('form')
        }
    }, [isReadyForForm, mode])

    useEffect(() => {
        if (
            !urlValidation ||
            !urlValidation.urlValidationResult?.isValid ||
            !urlValidation.urlValidationResult?.validated
        ) {
            setMode('input')
        }
    }, [urlValidation.urlValidationResult, urlValidation])

    useEffect(() => {
        if (aiMetadata.fetchDone && aiMetadata.suggestions.length > 0) {
            const suggestion = aiMetadata.suggestions[0]
            setValue('platform', suggestion.platform)
            setValue('thumbnailUrl', suggestion.thumbnailUrl)
            setValue('title', suggestion.title)
        }
    }, [aiMetadata.fetchDone, aiMetadata.suggestions, setValue])

    const reset = async (clearCache: boolean = false) => {
        const currentUrl = urlValidation.urlValidationResult?.url

        if (clearCache && currentUrl) {
            try {
                fetch(`/api/cache?url=${encodeURIComponent(currentUrl)}`, {
                    method: 'DELETE',
                })
            } catch (e) {
                console.error('Failed to clear cache:', e)
            }
        }

        urlValidation.unsetUrl()
        form.reset()
    }

    const onSubmit = async (data: VideoFormData) => {
        if (!urlValidation.urlValidationResult?.isValid) return

        setIsSubmitting(true)
        setSubmitError(null)

        try {
            const videoData = {
                url: data.url,
                title: data.title,
                platform: data.platform,
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
                reset(false) // Reset URL and global state
                form.reset() // Reset form
                toast.success('Video added successfully!')
            }
        } catch (error) {
            console.error('Error adding video:', error)
            setSubmitError('Failed to add video')
        } finally {
            setIsSubmitting(false)
        }
    }

    useEffect(() => {
        console.log(form.formState.errors)
    }, [form.formState.errors])

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
            <form onSubmit={form.handleSubmit(onSubmit)}>
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
                                disabled={isSubmitting}
                            />
                        ) : (
                            <div className='w-full max-w-7xl'>
                                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
                                    <div>
                                        <FormLayout
                                            isSubmitting={isSubmitting}
                                            submitError={submitError}
                                            suggestions={{
                                                ai: aiMetadata.suggestions,
                                                platform: platformSuggestions,
                                            }}
                                            aiMetadataError={aiMetadata.error}
                                            onReset={() => reset(true)}
                                            defaultMode={defaultMode}
                                        />
                                    </div>
                                    <div>
                                        <PreviewCard />
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
