'use client'

import { useCallback, useEffect, useState } from 'react'

import type { Tag } from '@/types/tag'

interface UseTagsOptions {
    /** Whether to fetch tags on mount (default: true) */
    fetchOnMount?: boolean
}

interface UseTagsReturn {
    /** List of all tags */
    tags: Tag[]
    /** Loading state */
    loading: boolean
    /** Error message if fetch failed */
    error: string | null
    /** Add a new tag */
    addTag: (name: string, color?: string) => Promise<Tag | null>
    /** Update an existing tag */
    updateTag: (
        id: number,
        data: { name?: string; color?: string },
    ) => Promise<boolean>
    /** Delete a tag */
    deleteTag: (id: number) => Promise<boolean>
    /** Refetch tags from API */
    refetch: () => Promise<void>
}

/**
 * Hook for managing tags with CRUD operations.
 * Centralizes tag fetching logic used across multiple components.
 */
export function useTags(options: UseTagsOptions = {}): UseTagsReturn {
    const { fetchOnMount = true } = options

    const [tags, setTags] = useState<Tag[]>([])
    const [loading, setLoading] = useState(fetchOnMount)
    const [error, setError] = useState<string | null>(null)

    const fetchTags = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch('/api/tags')
            if (response.ok) {
                const data = await response.json()
                setTags(data)
            } else {
                throw new Error('Failed to fetch tags')
            }
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Failed to fetch tags'
            setError(message)
            console.error('Error fetching tags:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    const addTag = useCallback(
        async (name: string, color?: string): Promise<Tag | null> => {
            try {
                const response = await fetch('/api/tags', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name.trim(),
                        color: color || '#6b7280',
                    }),
                })

                if (response.ok) {
                    const newTag = await response.json()
                    setTags((prev) => [...prev, newTag])
                    return newTag
                } else if (response.status === 409) {
                    // Tag already exists - find and return it
                    const existingTag = tags.find(
                        (t) => t.name.toLowerCase() === name.toLowerCase(),
                    )
                    return existingTag || null
                } else {
                    throw new Error('Failed to create tag')
                }
            } catch (err) {
                console.error('Error adding tag:', err)
                return null
            }
        },
        [tags],
    )

    const updateTag = useCallback(
        async (
            id: number,
            data: { name?: string; color?: string },
        ): Promise<boolean> => {
            try {
                const response = await fetch(`/api/tags/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                })

                if (response.ok) {
                    const updatedTag = await response.json()
                    setTags((prev) =>
                        prev.map((tag) => (tag.id === id ? updatedTag : tag)),
                    )
                    return true
                }
                return false
            } catch (err) {
                console.error('Error updating tag:', err)
                return false
            }
        },
        [],
    )

    const deleteTag = useCallback(async (id: number): Promise<boolean> => {
        try {
            const response = await fetch(`/api/tags/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setTags((prev) => prev.filter((tag) => tag.id !== id))
                return true
            }
            return false
        } catch (err) {
            console.error('Error deleting tag:', err)
            return false
        }
    }, [])

    useEffect(() => {
        if (fetchOnMount) {
            fetchTags()
        }
    }, [fetchOnMount, fetchTags])

    return {
        tags,
        loading,
        error,
        addTag,
        updateTag,
        deleteTag,
        refetch: fetchTags,
    }
}
