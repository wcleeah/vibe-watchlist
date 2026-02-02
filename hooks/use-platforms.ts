'use client'

import { useCallback, useEffect, useState } from 'react'

import type { PlatformOption } from '@/components/shared'
import { getIconComponent } from '@/lib/utils/icon-utils'

import type {
    NewPlatformData,
    PlatformConfig,
    UpdatePlatformData,
} from '@/types/platform'

interface UsePlatformsOptions {
    /** Whether to fetch platforms on mount (default: true) */
    fetchOnMount?: boolean
    /** Whether to resolve icon components for platformOptions (default: true) */
    includeIcons?: boolean
}

interface UsePlatformsReturn {
    /** List of all platforms (raw data) */
    platforms: PlatformConfig[]
    /** List of platforms with resolved icon components (for filter bars) */
    platformOptions: PlatformOption[]
    /** Loading state */
    loading: boolean
    /** Error message if operation failed */
    error: string | null
    /** Add a new platform */
    addPlatform: (data: NewPlatformData) => Promise<PlatformConfig | null>
    /** Update an existing platform */
    updatePlatform: (
        platformId: string,
        data: UpdatePlatformData,
    ) => Promise<boolean>
    /** Delete a platform (non-preset only) */
    deletePlatform: (platformId: string) => Promise<boolean>
    /** Toggle platform enabled/disabled state */
    toggleEnabled: (platformId: string, enabled: boolean) => Promise<boolean>
    /** Refetch platforms from API */
    refetch: () => Promise<void>
}

/**
 * Hook for managing platforms with CRUD operations.
 * Centralizes platform fetching and management logic used across multiple components.
 */
export function usePlatforms(
    options: UsePlatformsOptions = {},
): UsePlatformsReturn {
    const { fetchOnMount = true, includeIcons = true } = options

    const [platforms, setPlatforms] = useState<PlatformConfig[]>([])
    const [platformOptions, setPlatformOptions] = useState<PlatformOption[]>([])
    const [loading, setLoading] = useState(fetchOnMount)
    const [error, setError] = useState<string | null>(null)

    // Build platformOptions from platforms when includeIcons is true
    const buildPlatformOptions = useCallback(
        (platformList: PlatformConfig[]): PlatformOption[] => {
            if (!includeIcons) return []
            return platformList.map((p) => ({
                key: p.platformId,
                label: p.displayName,
                icon: getIconComponent(p.icon || 'Video'),
                color: p.color || '#6b7280',
            }))
        },
        [includeIcons],
    )

    const fetchPlatforms = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch('/api/platforms')
            if (response.ok) {
                const data = await response.json()
                const platformList = data.data || []
                setPlatforms(platformList)
                setPlatformOptions(buildPlatformOptions(platformList))
            } else {
                throw new Error('Failed to fetch platforms')
            }
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Failed to fetch platforms'
            setError(message)
            console.error('Error fetching platforms:', err)
        } finally {
            setLoading(false)
        }
    }, [buildPlatformOptions])

    const addPlatform = useCallback(
        async (data: NewPlatformData): Promise<PlatformConfig | null> => {
            try {
                const response = await fetch('/api/platforms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        platformId: data.platformId,
                        name: data.name,
                        displayName: data.displayName,
                        patterns: data.patterns,
                        extractor: data.extractor || 'ai',
                        color: data.color || '#6b7280',
                        icon: data.icon || 'Video',
                        confidenceScore: data.confidenceScore || 0.5,
                    }),
                })

                if (response.ok) {
                    const result = await response.json()
                    const newPlatform = result.data
                    setPlatforms((prev) => {
                        const updated = [...prev, newPlatform]
                        setPlatformOptions(buildPlatformOptions(updated))
                        return updated
                    })
                    return newPlatform
                } else if (response.status === 409) {
                    // Platform already exists - find and return it
                    const existingPlatform = platforms.find(
                        (p) =>
                            p.platformId.toLowerCase() ===
                            data.platformId.toLowerCase(),
                    )
                    return existingPlatform || null
                } else {
                    const errorData = await response.json()
                    throw new Error(
                        errorData.error || 'Failed to create platform',
                    )
                }
            } catch (err) {
                console.error('Error adding platform:', err)
                return null
            }
        },
        [platforms, buildPlatformOptions],
    )

    const updatePlatform = useCallback(
        async (
            platformId: string,
            data: UpdatePlatformData,
        ): Promise<boolean> => {
            try {
                const response = await fetch(`/api/platforms/${platformId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                })

                if (response.ok) {
                    const result = await response.json()
                    const updatedPlatform = result.data
                    setPlatforms((prev) => {
                        const updated = prev.map((p) =>
                            p.platformId === platformId ? updatedPlatform : p,
                        )
                        setPlatformOptions(buildPlatformOptions(updated))
                        return updated
                    })
                    return true
                }
                return false
            } catch (err) {
                console.error('Error updating platform:', err)
                return false
            }
        },
        [buildPlatformOptions],
    )

    const deletePlatform = useCallback(
        async (platformId: string): Promise<boolean> => {
            try {
                const response = await fetch(`/api/platforms/${platformId}`, {
                    method: 'DELETE',
                })

                if (response.ok) {
                    setPlatforms((prev) => {
                        const updated = prev.filter(
                            (p) => p.platformId !== platformId,
                        )
                        setPlatformOptions(buildPlatformOptions(updated))
                        return updated
                    })
                    return true
                }
                return false
            } catch (err) {
                console.error('Error deleting platform:', err)
                return false
            }
        },
        [buildPlatformOptions],
    )

    const toggleEnabled = useCallback(
        async (platformId: string, enabled: boolean): Promise<boolean> => {
            return updatePlatform(platformId, { enabled })
        },
        [updatePlatform],
    )

    useEffect(() => {
        if (fetchOnMount) {
            fetchPlatforms()
        }
    }, [fetchOnMount, fetchPlatforms])

    return {
        platforms,
        platformOptions,
        loading,
        error,
        addPlatform,
        updatePlatform,
        deletePlatform,
        toggleEnabled,
        refetch: fetchPlatforms,
    }
}
