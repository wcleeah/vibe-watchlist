'use client'

import { AnalyticsDashboard } from '@/components/analytics-dashboard'
import { NavigationTabs } from '@/components/navigation-tabs'

export default function AnalyticsPage() {
    return (
        <div className='min-h-screen bg-background text-foreground'>
            <NavigationTabs />

            <main className='container mx-auto px-4 pt-32 pb-12 max-w-6xl'>
                <AnalyticsDashboard />
            </main>
        </div>
    )
}
