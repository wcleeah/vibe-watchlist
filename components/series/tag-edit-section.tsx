'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TagList } from '@/components/ui/tag'
import type { Tag } from '@/types/tag'

interface TagEditSectionProps {
    selectedTags: Tag[]
    tagInput: string
    filteredSuggestions: Tag[]
    isSubmitting?: boolean
    isLoadingTags?: boolean
    onTagInputChange: (value: string) => void
    onAddTag: (tagName: string) => void
    onRemoveTag: (tagId: number) => void
    onSelectSuggestion: (tagId: number) => void
}

/**
 * Tag editing section for series/video forms
 */
export function TagEditSection({
    selectedTags,
    tagInput,
    filteredSuggestions,
    isSubmitting = false,
    isLoadingTags = false,
    onTagInputChange,
    onAddTag,
    onRemoveTag,
    onSelectSuggestion,
}: TagEditSectionProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            onAddTag(tagInput.trim())
        }
    }

    return (
        <div className='space-y-2'>
            <Label>Tags</Label>

            {selectedTags.length > 0 && (
                <TagList tags={selectedTags} onRemove={onRemoveTag} size='sm' />
            )}

            <div className='flex gap-2'>
                <Input
                    type='text'
                    placeholder='Add a tag'
                    value={tagInput}
                    onChange={(e) => onTagInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSubmitting || isLoadingTags}
                    className='flex-1'
                />
                <Button
                    type='button'
                    onClick={() => onAddTag(tagInput.trim())}
                    disabled={!tagInput.trim() || isSubmitting || isLoadingTags}
                >
                    Add
                </Button>
            </div>

            {filteredSuggestions.length > 0 && tagInput && (
                <div className='border rounded-md p-2 space-y-1'>
                    {filteredSuggestions.map((tag) => (
                        <button
                            key={tag.id}
                            type='button'
                            onClick={() => onSelectSuggestion(tag.id)}
                            className='w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm'
                        >
                            {tag.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
