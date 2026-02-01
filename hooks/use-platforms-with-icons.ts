'use client'

import { useCallback, useEffect, useState } from 'react'

import type { PlatformOption } from '@/components/shared'
import { getIconComponent } from '@/lib/utils/icon-utils'

interface UsePlatformsWithIconsOptions {
    /** Whether to fetch platforms on mount (default: true) */
    fetchOnMount?: boolean
}

interface UsePlatformsWithIconsReturn {
    /** List of platforms with icon components */
    platforms: PlatformOption[]
    /** Loading state */
    loading: boolean
    /** Error message if fetch failed */
    error: string | null
    /** Refetch platforms from API */
    refetch: () => Promise<void>
}

/**
 * Hook for fetching platforms with their icon components.
 * Centralizes platform fetching logic used across list pages.
 */
export function usePlatformsWithIcons(
    options: UsePlatformsWithIconsOptions = {},
): UsePlatformsWithIconsReturn {
    const { fetchOnMount = true } = options

    const [platforms, setPlatforms] = useState<PlatformOption[]>([])
    const [loading, setLoading] = useState(fetchOnMount)
    const [error, setError] = useState<string | null>(null)

    const fetchPlatforms = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch('/api/platforms')
            if (response.ok) {
                const data = await response.json()
                const platformData: PlatformOption[] = data.data.map(
                    (p: {
                        platformId: string
                        displayName: string
                        icon?: string
                        color?: string
                    }) => ({
                        key: p.platformId,
                        label: p.displayName,
                        icon: getIconComponent(p.icon || 'Video'),
                        color: p.color || '#6b7280',
                    }),
                )
                setPlatforms(platformData)
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
    }, [])

    useEffect(() => {
        if (fetchOnMount) {
            fetchPlatforms()
        }
    }, [fetchOnMount, fetchPlatforms])

    return {
        platforms,
        loading,
        error,
        refetch: fetchPlatforms,
    }
}
