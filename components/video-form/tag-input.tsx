'use client'

import { Loader2 } from 'lucide-react'
import { forwardRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TagList } from '@/components/ui/tag'
import { cn } from '@/lib/utils'
import type { Tag } from '@/types/tag'

interface TagInputProps {
    value: string
    onChange: (value: string) => void
    onTagAdd: (tagName: string) => Promise<void>
    onTagRemove: (tagId: number) => void
    selectedTags: Tag[]
    suggestions: Tag[]
    showSuggestions: boolean
    onSelectSuggestion: (tag: Tag) => void
    isLoading?: boolean
    error?: string | null
    placeholder?: string
    className?: string
}

export const TagInput = forwardRef<HTMLInputElement, TagInputProps>(
    (
        {
            value,
            onChange,
            onTagAdd,
            onTagRemove,
            selectedTags,
            suggestions,
            showSuggestions,
            onSelectSuggestion,
            isLoading = false,
            error,
            placeholder = 'Add tags',
            className,
        },
        ref,
    ) => {
        const [isFocused, setIsFocused] = useState(false)
        const [pendingBlur, setPendingBlur] = useState(false)

        const handleKeyDown = async (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                if (value.trim()) {
                    await onTagAdd(value.trim())
                }
            } else if (e.key === 'Escape') {
                setIsFocused(false)
            }
        }

        const handleBlur = () => {
            setPendingBlur(true)
            // Use requestAnimationFrame instead of setTimeout for better performance
            requestAnimationFrame(() => {
                // Only hide if we're not clicking on a suggestion
                if (pendingBlur && !isFocused) {
                    setIsFocused(false)
                }
                setPendingBlur(false)
            })
        }

        const handleSuggestionClick = (tag: Tag) => {
            onSelectSuggestion(tag)
            setIsFocused(false)
            setPendingBlur(false)
        }

        return (
            <div className='space-y-2'>
                {/* Selected tags */}
                {selectedTags.length > 0 && (
                    <div id='selected-tags'>
                        <TagList
                            tags={selectedTags}
                            onRemove={onTagRemove}
                            size='sm'
                        />
                    </div>
                )}

                <div className='relative'>
                    <div className='flex gap-2'>
                        <Input
                            ref={ref}
                            type='text'
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(true)}
                            onBlur={handleBlur}
                            className={cn('flex-1', className)}
                            disabled={isLoading}
                            aria-label='Tag input'
                            aria-describedby={
                                error
                                    ? 'tag-input-error'
                                    : selectedTags.length > 0
                                      ? 'selected-tags'
                                      : undefined
                            }
                            aria-expanded={
                                showSuggestions &&
                                suggestions.length > 0 &&
                                isFocused
                            }
                            aria-haspopup='listbox'
                            role='combobox'
                            aria-autocomplete='list'
                        />
                        {isLoading ? (
                            <div className='flex h-9 min-h-0 items-center justify-center rounded-md border border-input bg-muted px-4'>
                                <Loader2 className='w-4 h-4 animate-spin text-gray-400' />
                            </div>
                        ) : (
                            <Button
                                type='button'
                                onClick={() => onTagAdd(value.trim())}
                                disabled={!value.trim()}
                                className='h-9 min-h-0'
                            >
                                Add
                            </Button>
                        )}
                    </div>

                    {/* Suggestions dropdown */}
                    {showSuggestions && suggestions.length > 0 && isFocused && (
                        <div
                            className='absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto'
                            role='listbox'
                            aria-label='Tag suggestions'
                        >
                            {suggestions.map((tag) => (
                                <button
                                    type='button'
                                    key={tag.id}
                                    onClick={() => handleSuggestionClick(tag)}
                                    className='w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:hover:bg-gray-700 dark:focus:bg-gray-700'
                                    role='option'
                                    aria-selected={false}
                                >
                                    <span>{tag.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Error message */}
                {error && (
                    <div
                        id='tag-input-error'
                        className='text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800'
                        role='alert'
                        aria-live='polite'
                    >
                        {error}
                    </div>
                )}
            </div>
        )
    },
)

TagInput.displayName = 'TagInput'
