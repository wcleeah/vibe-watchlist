'use client'

import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { useTagManagement } from '@/hooks/use-tag-management'
import type { MetadataSuggestion } from '@/lib/types/ai-metadata'
import type { VideoFormData } from '@/types/form'
import { MetadataSelector } from '../metadata-selector'
import { SubmitButton } from '../submit-button'
import { TagInput } from '../tag-input'

interface VideoFormProps {
    suggestions: MetadataSuggestion[]
    error?: string | null
    isSubmitting: boolean
    submitError: string | null
    onReset: () => void
}

export function VideoForm({
    suggestions,
    error,
    isSubmitting,
    submitError,
    onReset,
}: VideoFormProps) {
    const { setValue, getValues } = useFormContext<VideoFormData>()
    const [selectedSuggestion, setSelectedSuggestion] = useState(0)

    const tagManagement = useTagManagement()

    // Sync tags to form
    useEffect(() => {
        setValue('tags', tagManagement.selectedTagIds)
        setValue(
            'tagStrs',
            tagManagement.selectedTagIds.map((id) => {
                const tag = tagManagement.availableTags.find((t) => t.id === id)
                return tag?.name || ''
            }),
        )
    }, [tagManagement.selectedTagIds, tagManagement.availableTags, setValue])

    // Handle suggestion selection
    const handleSuggestionSelect = (index: number) => {
        setSelectedSuggestion(index)
        const suggestion = suggestions[index]
        if (suggestion) {
            setValue('title', suggestion.title)
            setValue('thumbnailUrl', suggestion.thumbnailUrl || '')
            const currentPlatform = getValues('platform')
            if (currentPlatform === 'unknown') {
                setValue('platform', suggestion.platform)
            }
        }
    }

    return (
        <div className='space-y-6'>
            <MetadataSelector
                suggestions={suggestions}
                selectedIndex={selectedSuggestion}
                onSelect={handleSuggestionSelect}
                error={error || undefined}
                disabled={isSubmitting}
            />

            <TagInput
                value={tagManagement.tagInput}
                onChange={tagManagement.setTagInput}
                onTagAdd={tagManagement.addTag}
                onTagRemove={tagManagement.removeTag}
                selectedTags={tagManagement.availableTags.filter((t) =>
                    tagManagement.selectedTagIds.includes(t.id),
                )}
                suggestions={tagManagement.filteredSuggestions}
                showSuggestions={true}
                onSelectSuggestion={tagManagement.selectTag}
                isLoading={tagManagement.isLoading}
                error={tagManagement.error}
            />

            <div className='flex gap-2'>
                <Button
                    type='button'
                    variant='secondary'
                    className='flex-1 h-12'
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
            </div>

            {submitError && (
                <p className='text-sm text-destructive text-center'>
                    {submitError}
                </p>
            )}
        </div>
    )
}
