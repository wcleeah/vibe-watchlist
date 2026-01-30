'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MAX_TAG_SUGGESTIONS } from '@/lib/constants/form'
import type { Tag } from '@/types/tag'

interface UseTagManagementReturn {
    // State
    availableTags: Tag[]
    selectedTagIds: number[]
    tagInput: string
    isLoading: boolean
    error: string | null
    filteredSuggestions: Tag[]

    // Actions
    setTagInput: (value: string) => void
    addTag: (tagName: string) => Promise<void>
    removeTag: (tagId: number) => void
    selectTag: (tag: Tag) => void
    setSelectedTagIds: (ids: number[]) => void
}

export function useTagManagement(): UseTagManagementReturn {
    const [availableTags, setAvailableTags] = useState<Tag[]>([])
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
    const [tagInput, setTagInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch tags on mount
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await fetch('/api/tags')
                if (response.ok) {
                    const tags = await response.json()
                    setAvailableTags(tags)
                }
            } catch {
                // Silently handle fetch errors
            }
        }
        fetchTags()
    }, [])

    const filteredSuggestions = useMemo(() => {
        return availableTags
            .filter(
                (tag) =>
                    tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
                    !selectedTagIds.includes(tag.id),
            )
            .slice(0, MAX_TAG_SUGGESTIONS)
    }, [availableTags, tagInput, selectedTagIds])

    const addTag = useCallback(
        async (tagName: string) => {
            if (!tagName.trim()) return

            // Check if tag already exists
            const existingTag = availableTags.find(
                (t) => t.name.toLowerCase() === tagName.toLowerCase(),
            )

            if (existingTag) {
                if (!selectedTagIds.includes(existingTag.id)) {
                    setSelectedTagIds((ids) => [...ids, existingTag.id])
                }
                setTagInput('')
                return
            }

            // Create new tag
            setIsLoading(true)
            setError(null)
            try {
                const response = await fetch('/api/tags', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: tagName.trim() }),
                })

                if (response.ok) {
                    const newTag = await response.json()
                    setAvailableTags((prev) => [...prev, newTag])
                    setSelectedTagIds((ids) => [...ids, newTag.id])
                    setTagInput('')
                } else if (response.status === 409) {
                    setError('Tag already exists')
                } else {
                    setError('Failed to create tag')
                }
            } catch {
                setError('Failed to create tag')
            } finally {
                setIsLoading(false)
            }
        },
        [availableTags, selectedTagIds],
    )

    const removeTag = useCallback((tagId: number) => {
        setSelectedTagIds((ids) => ids.filter((id) => id !== tagId))
    }, [])

    const selectTag = useCallback(
        (tag: Tag) => {
            if (!selectedTagIds.includes(tag.id)) {
                setSelectedTagIds((ids) => [...ids, tag.id])
            }
            setTagInput('')
        },
        [selectedTagIds],
    )

    return {
        availableTags,
        selectedTagIds,
        tagInput,
        isLoading,
        error,
        filteredSuggestions,
        setTagInput,
        addTag,
        removeTag,
        selectTag,
        setSelectedTagIds,
    }
}
