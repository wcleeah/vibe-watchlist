'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { ComingSoonFilters, ComingSoonWithTags } from '@/types/coming-soon'

interface UseComingSoonReturn {
    items: ComingSoonWithTags[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    deleteItem: (id: number) => Promise<void>
    reorderItems: (orderedIds: number[]) => Promise<void>
}

interface UseComingSoonOptions {
    filters?: ComingSoonFilters
    autoFetch?: boolean
}

/**
 * Hook for fetching and managing coming soon data in frontend components
 */
export function useComingSoon(
    options: UseComingSoonOptions = {},
): UseComingSoonReturn {
    const { filters, autoFetch = true } = options

    const [items, setItems] = useState<ComingSoonWithTags[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const params = new URLSearchParams()

            if (filters?.transformed !== undefined) {
                params.set('transformed', filters.transformed.toString())
            }

            if (filters?.search?.trim()) {
                params.set('search', filters.search.trim())
            }

            if (filters?.platforms && filters.platforms.length > 0) {
                params.set('platforms', filters.platforms.join(','))
            }

            if (filters?.tagIds && filters.tagIds.length > 0) {
                params.set('tags', filters.tagIds.join(','))
            }

            if (filters?.sortBy) {
                params.set('sortBy', filters.sortBy)
            }
            if (filters?.sortOrder) {
                params.set('sortOrder', filters.sortOrder)
            }

            const response = await fetch(
                `/api/coming-soon?${params.toString()}`,
            )
            if (response.ok) {
                const data = await response.json()
                setItems(data)
            } else {
                const errorData = await response.json()
                throw new Error(
                    errorData.error || 'Failed to fetch coming soon items',
                )
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to fetch coming soon items',
            )
            console.error('Failed to fetch coming soon items:', err)
        } finally {
            setLoading(false)
        }
    }, [filters])

    const deleteItem = useCallback(
        async (id: number) => {
            try {
                const response = await fetch(`/api/coming-soon/${id}`, {
                    method: 'DELETE',
                })

                if (response.ok) {
                    setItems((prev) => prev.filter((item) => item.id !== id))
                    toast.success('Coming soon item deleted')
                } else {
                    const errorData = await response.json()
                    throw new Error(errorData.error || 'Failed to delete item')
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to delete item',
                )
                console.error('Failed to delete coming soon item:', err)
                await fetchItems()
            }
        },
        [fetchItems],
    )

    const reorderItems = useCallback(async (orderedIds: number[]) => {
        const response = await fetch('/api/coming-soon/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderedIds }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(
                errorData.error || 'Failed to reorder coming soon items',
            )
        }

        setItems((prev) => {
            const itemMap = new Map(prev.map((item) => [item.id, item]))
            return orderedIds
                .map((id) => itemMap.get(id))
                .filter(
                    (item): item is ComingSoonWithTags => item !== undefined,
                )
        })
    }, [])

    useEffect(() => {
        if (autoFetch) {
            fetchItems()
        }
    }, [autoFetch, fetchItems])

    return {
        items,
        loading,
        error,
        refetch: fetchItems,
        deleteItem,
        reorderItems,
    }
}
