'use client'

import { useCallback, useEffect, useState } from 'react'

import type { UsageRequest, UsageSummary } from '@/lib/types/usage'

interface UseUsageStatsOptions {
    /** Filter by operation type */
    operation?: string
    /** Number of recent requests to fetch */
    limit?: number
}

interface UseUsageStatsReturn {
    summary: UsageSummary | null
    requests: UsageRequest[]
    loading: boolean
    refetch: () => Promise<void>
    setOperation: (operation: string) => void
}

/**
 * Hook for fetching and managing API usage statistics
 */
export function useUsageStats(
    options: UseUsageStatsOptions = {},
): UseUsageStatsReturn {
    const { limit = 25 } = options

    const [operation, setOperation] = useState(options.operation || '')
    const [summary, setSummary] = useState<UsageSummary | null>(null)
    const [requests, setRequests] = useState<UsageRequest[]>([])
    const [loading, setLoading] = useState(true)

    const fetchUsageStats = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (operation) {
                params.set('operation', operation)
            }
            params.set('limit', String(limit))

            const response = await fetch(`/api/usage-stats?${params}`)
            if (!response.ok) throw new Error('Failed to fetch usage')
            const data = await response.json()
            setSummary(data.summary)
            setRequests(data.requests)
        } catch (error) {
            console.error('Failed to fetch usage stats:', error)
        } finally {
            setLoading(false)
        }
    }, [operation, limit])

    useEffect(() => {
        fetchUsageStats()
    }, [fetchUsageStats])

    return {
        summary,
        requests,
        loading,
        refetch: fetchUsageStats,
        setOperation,
    }
}
