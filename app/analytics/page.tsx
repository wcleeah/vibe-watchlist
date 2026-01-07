'use client'

import { useEffect, useRef } from 'react'
import { AnalyticsDashboard } from '@/components/analytics-dashboard'
import { NavigationTabs } from '@/components/navigation-tabs'
import { AnalyticsProvider, useAnalytics } from '@/lib/analytics-context'

function AnalyticsPageContent() {
    const { countdown, refreshStats } = useAnalytics()
    const lastFetchRef = useRef(0)

    // Ensure fresh data on page entry (throttled to prevent server overload)
    useEffect(() => {
        const now = Date.now()
        if (now - lastFetchRef.current > 10000) {
            // Only fetch if more than 10 seconds since last fetch
            refreshStats()
            lastFetchRef.current = now
        }
    }, [refreshStats])

    return (
        <div className='min-h-screen bg-background text-foreground'>
            <NavigationTabs />

            <main className='container mx-auto px-4 pt-32 pb-12 max-w-6xl'>
                <div className='mb-6 text-right'>
                    <span className='text-sm text-gray-500 dark:text-gray-400'>
                        Next update in {countdown}s
                    </span>
                </div>
                <AnalyticsDashboard />
            </main>
        </div>
    )
}

export default function AnalyticsPage() {
    return (
        <AnalyticsProvider>
            <AnalyticsPageContent />
        </AnalyticsProvider>
    )
}
