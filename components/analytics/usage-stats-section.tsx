'use client'

import {
    ArrowDownToLine,
    ArrowUpFromLine,
    Clock,
    Database,
    RefreshCw,
} from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import type { UsageRequest, UsageSummary } from '@/lib/types/usage'
import { formatDuration, formatNumber } from '@/lib/utils/format-utils'

import { OperationStatsGrid } from './operation-stats-grid'
import { RequestDetailModal } from './request-detail-modal'
import { StatCard } from './stat-card'
import { UsageRequestsTable } from './usage-requests-table'

interface UsageStatsSectionProps {
    summary: UsageSummary | null
    requests: UsageRequest[]
    loading: boolean
    selectedOperation: string
    onOperationChange: (operation: string) => void
    onRefresh: () => void
}

export function UsageStatsSection({
    summary,
    requests,
    loading,
    selectedOperation,
    onOperationChange,
    onRefresh,
}: UsageStatsSectionProps) {
    const [selectedRequest, setSelectedRequest] = useState<UsageRequest | null>(
        null,
    )
    const [detailOpen, setDetailOpen] = useState(false)

    const handleRowClick = (request: UsageRequest) => {
        setSelectedRequest(request)
        setDetailOpen(true)
    }

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <Database className='w-5 h-5' />
                    <h2 className='text-xl font-semibold'>API Usage</h2>
                </div>
                <Button
                    onClick={onRefresh}
                    disabled={loading}
                    variant='outline'
                    size='sm'
                >
                    <RefreshCw
                        className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                    />
                    Refresh
                </Button>
            </div>

            {!summary && loading ? (
                <div className='text-center py-8 text-gray-500'>
                    Loading usage stats...
                </div>
            ) : summary ? (
                <>
                    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                        <StatCard
                            value={summary.totalRequests}
                            label='Requests'
                        />
                        <StatCard
                            value={summary.totalPromptTokens}
                            label='In Tokens'
                            icon={ArrowDownToLine}
                            iconColor='text-blue-500'
                        />
                        <StatCard
                            value={summary.totalCompletionTokens}
                            label='Out Tokens'
                            icon={ArrowUpFromLine}
                            iconColor='text-green-500'
                        />
                        <StatCard
                            value={summary.totalTokens}
                            label='Total Tokens'
                        />
                        <StatCard
                            value={formatDuration(summary.avgDurationMs)}
                            label='Avg Duration'
                            icon={Clock}
                            iconColor='text-purple-500'
                        />
                        <StatCard
                            value={summary.avgPromptTokens}
                            label='In Avg'
                            icon={ArrowDownToLine}
                            iconColor='text-blue-300'
                        />
                        <StatCard
                            value={summary.avgCompletionTokens}
                            label='Out Avg'
                            icon={ArrowUpFromLine}
                            iconColor='text-green-300'
                        />
                        <StatCard
                            value={summary.avgTotalTokens}
                            label='Avg Tokens'
                            icon={Database}
                            iconColor='text-gray-500'
                        />
                    </div>

                    <OperationStatsGrid operations={summary.byOperation} />

                    <UsageRequestsTable
                        requests={requests}
                        selectedOperation={selectedOperation}
                        onOperationChange={onOperationChange}
                        onRowClick={handleRowClick}
                    />
                </>
            ) : (
                <div className='text-center py-8 text-gray-500'>
                    No usage data available
                </div>
            )}

            <RequestDetailModal
                request={selectedRequest}
                open={detailOpen}
                onOpenChange={setDetailOpen}
            />
        </div>
    )
}
