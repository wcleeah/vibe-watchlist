'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import type { PlatformSuggestion } from '@/lib/services/ai-service'
import type { VideoFormData, VideoSuggestions } from '@/types/form'
import type { Tag } from '@/types/tag'
import { MetadataSelector } from './metadata-selector'
import { PlatformSuggestions } from './platform-suggestions'
import { SubmitButton } from './submit-button'
import { TagInput } from './tag-input'

interface FormLayoutProps {
    isSubmitting: boolean
    submitError: string | null
    suggestions?: VideoSuggestions
    aiMetadataError?: string | null
    onReset: () => void
}

export function FormLayout({
    isSubmitting,
    submitError,
    suggestions = { ai: [], platform: [] },
    aiMetadataError,
    onReset,
}: FormLayoutProps) {
    const { setValue, getValues, watch } = useFormContext<VideoFormData>()
    const [selectedSuggestion, setSelectedSuggestion] = useState<
        number | undefined
    >(0)
    const [availableTags, setAvailableTags] = useState<Tag[]>([])
    const [tagInput, setTagInput] = useState('')
    const [isLoadingTags, setIsLoadingTags] = useState(false)
    const [tagError, setTagError] = useState<string | null>(null)

    // Platform suggestion handlers
    const acceptPlatformSuggestion = async (suggestion: PlatformSuggestion) => {
        try {
            const response = await fetch('/api/platforms/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
                console.log(
                    '✅ Platform created successfully:',
                    result.platform,
                )
                setValue('platform', result.platform.platformId)
            } else {
                const error = await response.json()
                console.error('❌ Failed to create platform:', error)
                // TODO: Add toast error
            }
        } catch (error) {
            console.error('❌ Platform creation error:', error)
            // TODO: Add toast error
        }
    }

    // Get current selected tags from form
    const selectedTagIds = watch('tags') || []
    const selectedTags = useMemo(
        () => availableTags.filter((tag) => selectedTagIds.includes(tag.id)),
        [availableTags, selectedTagIds],
    )

    // Load available tags on mount
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await fetch('/api/tags')
                if (response.ok) {
                    const tags = await response.json()
                    setAvailableTags(tags)
                }
            } catch (error) {
                console.error('Failed to fetch tags:', error)
            }
        }
        fetchTags()
    }, [])

    const addTag = useCallback(
        async (tagName: string) => {
            if (!tagName) return

            // Check if tag is already selected
            if (
                selectedTags.some(
                    (tag) => tag.name.toLowerCase() === tagName.toLowerCase(),
                )
            ) {
                setTagError('Tag already added')
                return
            }

            // Check if tag exists in available tags
            const existingTag = availableTags.find(
                (tag) => tag.name.toLowerCase() === tagName.toLowerCase(),
            )
            if (existingTag) {
                setValue('tags', [...selectedTagIds, existingTag.id])
                setValue('tagStrs', [
                    ...(selectedTags ? selectedTags.map((t) => t.name) : []),
                    existingTag.name,
                ])
                setTagInput('')
                return
            }

            // Create new tag
            setIsLoadingTags(true)
            try {
                const response = await fetch('/api/tags', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: tagName }),
                })

                if (response.ok) {
                    const newTag = await response.json()
                    setAvailableTags((prev) => [...prev, newTag])
                    setValue('tags', [...selectedTagIds, newTag.id])
                    setValue('tagStrs', [
                        ...(selectedTags
                            ? selectedTags.map((t) => t.name)
                            : []),
                        newTag.name,
                    ])
                    setTagInput('')
                } else if (response.status === 409) {
                    // Tag already exists, fetch it
                    const existingTag = availableTags.find(
                        (tag) =>
                            tag.name.toLowerCase() === tagName.toLowerCase(),
                    )
                    if (existingTag) {
                        setValue('tags', [...selectedTagIds, existingTag.id])
                    }
                    setTagError('Tag already exists')
                } else {
                    setTagError('Failed to create tag')
                }
            } catch (error) {
                console.error('Error creating tag:', error)
                setTagError('Failed to create tag')
            } finally {
                setIsLoadingTags(false)
            }
        },
        [selectedTagIds, setValue, availableTags, selectedTags],
    )

    const removeTag = useCallback(
        (tagId: number) => {
            const ids = selectedTagIds.filter((id: number) => id !== tagId)
            setValue('tags', ids)
            setValue(
                'tagStrs',
                ids.map((id) => availableTags[id].name),
            )
        },
        [selectedTagIds, setValue, availableTags],
    )

    const selectSuggestedTag = useCallback(
        (tag: Tag) => {
            if (!selectedTagIds.includes(tag.id)) {
                setValue('tags', [...selectedTagIds, tag.id])
            }
            setTagInput('')
        },
        [selectedTagIds, setValue],
    )

    // Filter suggestions based on input
    const filteredTags = availableTags
        .filter(
            (tag) =>
                tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
                !selectedTags.some((selected) => selected.id === tag.id),
        )
        .slice(0, 5)

    return (
        <div className={`space-y-6`}>
            <div className='text-center mb-4'>
                <h2 className='text-xl font-semibold'>Add Tags</h2>
            </div>

            {/* Platform Suggestions */}
            {suggestions.platform.length > 0 && (
                <PlatformSuggestions
                    suggestions={suggestions.platform}
                    onAccept={acceptPlatformSuggestion}
                    onReject={() => setValue('platform', 'unknown')}
                    onPlatformCreated={(platform) =>
                        setValue('platform', platform)
                    }
                />
            )}

            <MetadataSelector
                suggestions={suggestions.ai}
                selectedIndex={selectedSuggestion}
                onSelect={(index) => {
                    setSelectedSuggestion(index)
                    const suggestion = suggestions.ai[index]
                    setValue('title', suggestion.title)
                    setValue('thumbnailUrl', suggestion.thumbnailUrl || '')
                    const platform: string = getValues('platform')
                    if (platform === 'unknown') {
                        setValue('platform', suggestion.platform || '')
                    }

                    // Log suggestion acceptance via API
                    fetch('/api/events/log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            eventType: 'suggestion_accepted',
                            payload: {
                                suggestionType: 'ai',
                                platform: suggestion.platform,
                                confidence: suggestion.confidence,
                                hasThumbnail: !!suggestion.thumbnailUrl,
                            },
                        }),
                    }).catch((error) => {
                        console.warn(
                            'Failed to log suggestion acceptance:',
                            error,
                        )
                    })
                }}
                error={aiMetadataError || undefined}
                disabled={isSubmitting}
            />

            <TagInput
                value={tagInput}
                onChange={(tag) => setTagInput(tag)}
                onTagAdd={addTag}
                onTagRemove={removeTag}
                selectedTags={selectedTags}
                suggestions={filteredTags}
                showSuggestions={true}
                onSelectSuggestion={selectSuggestedTag}
                isLoading={isLoadingTags || isSubmitting}
                error={tagError}
            />

            <div className='flex gap-2'>
                <Button
                    variant='secondary'
                    className='flex-1 h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]'
                    onClick={onReset}
                    disabled={isSubmitting}
                >
                    Reset
                </Button>
                <SubmitButton
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    className='flex-1'
                />
                {submitError && <div>{submitError}</div>}
            </div>
        </div>
    )
}
