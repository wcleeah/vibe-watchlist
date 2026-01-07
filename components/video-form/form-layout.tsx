'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import type { MetadataSuggestion } from '@/lib/types/ai-metadata'
import type { PlatformSuggestion } from '@/lib/services/ai-service'
import type { Tag } from '@/types/tag'
import type { VideoSuggestions } from '@/types/form'
import { MetadataSelector } from './metadata-selector'
import { SubmitButton } from './submit-button'
import { TagInput } from './tag-input'
import { PlatformSuggestions } from './platform-suggestions'

interface FormLayoutProps {
    handleSubmit: () => Promise<void>
    isSubmitting: boolean
    submitError: string | null
    // Unified suggestions
    suggestions?: VideoSuggestions
    selectedSuggestion?: MetadataSuggestion
    onSuggestionSelect?: (suggestion: MetadataSuggestion | undefined) => void
    aiMetadataError?: string | null
    onManualEdit?: () => void
    // Platform creation callback
    onPlatformCreated?: (platform: any) => void
    // Tag props to sync with preview
    onSelectedTagsChange?: (tags: Tag[]) => void
    onReset?: () => void
}

export function FormLayout({
    handleSubmit,
    isSubmitting,
    suggestions = { ai: [], platform: [] },
    selectedSuggestion,
    onSuggestionSelect,
    aiMetadataError,
    onManualEdit,
    onPlatformCreated,
    // Tag props
    onSelectedTagsChange,
    onReset,
}: FormLayoutProps) {
    const { setValue } = useFormContext()

    // Platform suggestion state
    const [platformSuggestions, setPlatformSuggestions] = useState<
        PlatformSuggestion[]
    >([])
    const [isDetectingPlatform, setIsDetectingPlatform] = useState(false)

    // Sync platform suggestions from props
    useEffect(() => {
        setPlatformSuggestions(suggestions.platform)
    }, [suggestions.platform])

    // Set form values when suggestion is selected
    useEffect(() => {
        if (selectedSuggestion) {
            setValue('title', selectedSuggestion.title)
            setValue('thumbnailUrl', selectedSuggestion.thumbnailUrl || '')
        }
    }, [selectedSuggestion, setValue])

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
                // TODO: Add toast success
                setPlatformSuggestions([])
                onPlatformCreated?.(result.platform)
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

    const rejectPlatformSuggestions = () => {
        setPlatformSuggestions([])
    }

    // Tag state
    const [availableTags, setAvailableTags] = useState<Tag[]>([])
    const [tagInput, setTagInput] = useState('')
    const [showTagSuggestions, setShowTagSuggestions] = useState(false)
    const [isLoadingTags, setIsLoadingTags] = useState(false)
    const [tagError, setTagError] = useState<string | null>(null)

    // Get current selected tags from form
    const selectedTagIds =
        useWatch({ control: useFormContext().control, name: 'tags' }) || []
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

    // Sync selectedTags to parent for preview
    useEffect(() => {
        onSelectedTagsChange?.(selectedTags)
    }, [selectedTags, onSelectedTagsChange])

    // Tag management functions
    const handleTagInputChange = useCallback((value: string) => {
        setTagInput(value)
        setShowTagSuggestions(value.length > 0)
        setTagError(null)
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
                setTagInput('')
                setShowTagSuggestions(false)
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
                    setTagInput('')
                    setShowTagSuggestions(false)
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
        [selectedTagIds, setValue, availableTags],
    )

    const removeTag = useCallback(
        (tagId: number) => {
            setValue(
                'tags',
                selectedTagIds.filter((id) => id !== tagId),
            )
        },
        [selectedTagIds, setValue],
    )

    const selectSuggestedTag = useCallback(
        (tag: Tag) => {
            if (!selectedTagIds.includes(tag.id)) {
                setValue('tags', [...selectedTagIds, tag.id])
            }
            setTagInput('')
            setShowTagSuggestions(false)
        },
        [selectedTagIds, setValue],
    )

    // Filter suggestions based on input
    const filteredSuggestions = availableTags
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
            {platformSuggestions.length > 0 && (
                <PlatformSuggestions
                    suggestions={platformSuggestions}
                    onAccept={acceptPlatformSuggestion}
                    onReject={rejectPlatformSuggestions}
                    onPlatformCreated={onPlatformCreated}
                    isLoading={isDetectingPlatform}
                />
            )}

            <MetadataSelector
                suggestions={suggestions.ai}
                selectedIndex={
                    selectedSuggestion
                        ? suggestions.ai.indexOf(selectedSuggestion)
                        : undefined
                }
                onSelect={(index) => {
                    const suggestion = suggestions.ai[index]
                    onSuggestionSelect?.(suggestion)
                }}
                onManualEdit={onManualEdit}
                error={aiMetadataError || undefined}
                disabled={isSubmitting}
            />

            <TagInput
                value={tagInput}
                onChange={handleTagInputChange}
                onTagAdd={addTag}
                onTagRemove={removeTag}
                selectedTags={selectedTags}
                suggestions={filteredSuggestions}
                showSuggestions={showTagSuggestions}
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
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    className='flex-1'
                />
            </div>
        </div>
    )
}
