'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PlatformConfig } from '@/lib/db/schema'

interface UsePlatformsReturn {
    platforms: PlatformConfig[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
}

/**
 * Hook for fetching platform data in frontend components
 * Follows the same pattern as settings components (platform-list.tsx)
 */
export function usePlatforms(): UsePlatformsReturn {
    const [platforms, setPlatforms] = useState<PlatformConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPlatforms = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch('/api/platforms')
            if (response.ok) {
                const data = await response.json()
                setPlatforms(data.data || [])
            } else {
                setError('Failed to fetch platforms')
            }
        } catch (err) {
            setError('Network error')
            console.error('Failed to fetch platforms:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPlatforms()
    }, [fetchPlatforms])

    return {
        platforms,
        loading,
        error,
        refetch: fetchPlatforms,
    }
}
