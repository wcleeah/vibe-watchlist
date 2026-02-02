'use client'

import { Database, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUsageStats } from '@/hooks/use-usage-stats'
import { useWatchStats } from '@/hooks/use-watch-stats'

import { UsageStatsSection, VideoStatsSection } from './analytics'

export function AnalyticsDashboard() {
    const {
        stats,
        loading: statsLoading,
        lastUpdated,
        refetch: refetchStats,
    } = useWatchStats()

    const [selectedOperation, setSelectedOperation] = useState('')
    const {
        summary: usageSummary,
        requests: usageRequests,
        loading: usageLoading,
        refetch: refetchUsage,
        setOperation,
    } = useUsageStats({ operation: selectedOperation })

    // Handle operation filter change
    const handleOperationChange = (operation: string) => {
        setSelectedOperation(operation)
        setOperation(operation)
    }

    // Auto-refresh both stats every 15 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refetchStats()
            refetchUsage()
        }, 15000)
        return () => clearInterval(interval)
    }, [refetchStats, refetchUsage])

    return (
        <Tabs defaultValue='stats'>
            <TabsList>
                <TabsTrigger value='stats' className='flex items-center gap-2'>
                    <TrendingUp className='w-4 h-4' />
                    Live Stats
                </TabsTrigger>
                <TabsTrigger value='usage' className='flex items-center gap-2'>
                    <Database className='w-4 h-4' />
                    API Usage
                </TabsTrigger>
            </TabsList>

            <TabsContent value='stats'>
                <VideoStatsSection
                    stats={stats}
                    loading={statsLoading}
                    lastUpdated={lastUpdated}
                    onRefresh={refetchStats}
                />
            </TabsContent>

            <TabsContent value='usage'>
                <UsageStatsSection
                    summary={usageSummary}
                    requests={usageRequests}
                    loading={usageLoading}
                    selectedOperation={selectedOperation}
                    onOperationChange={handleOperationChange}
                    onRefresh={refetchUsage}
                />
            </TabsContent>
        </Tabs>
    )
}
