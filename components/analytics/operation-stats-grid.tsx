import { formatDuration, formatNumber } from '@/lib/utils/format-utils'

import { OPERATION_LABELS } from './types'

interface OperationData {
    requests: number
    avgPromptTokens: number
    avgCompletionTokens: number
    avgTotalTokens: number
    avgDurationMs?: number | null
}

interface OperationStatsGridProps {
    operations: Record<string, OperationData>
}

export function OperationStatsGrid({ operations }: OperationStatsGridProps) {
    return (
        <div className='grid grid-cols-2 gap-4'>
            {Object.entries(operations).map(([op, data]) => (
                <div key={op} className='p-4 border border-gray-200'>
                    <h4 className='font-semibold font-mono mb-3'>
                        {OPERATION_LABELS[op] || op}
                    </h4>
                    <div className='space-y-1 text-sm'>
                        <div className='flex justify-between'>
                            <span className='text-gray-600'>Requests:</span>
                            <span className='font-mono'>
                                {formatNumber(data.requests)}
                            </span>
                        </div>
                        <div className='flex justify-between'>
                            <span className='text-gray-600'>In Avg:</span>
                            <span className='font-mono'>
                                {formatNumber(data.avgPromptTokens)}
                            </span>
                        </div>
                        <div className='flex justify-between'>
                            <span className='text-gray-600'>Out Avg:</span>
                            <span className='font-mono'>
                                {formatNumber(data.avgCompletionTokens)}
                            </span>
                        </div>
                        <div className='flex justify-between font-semibold'>
                            <span className='text-gray-600'>Total Avg:</span>
                            <span className='font-mono'>
                                {formatNumber(data.avgTotalTokens)}
                            </span>
                        </div>
                        {data.avgDurationMs && (
                            <div className='flex justify-between'>
                                <span className='text-gray-600'>Duration:</span>
                                <span className='font-mono'>
                                    {formatDuration(data.avgDurationMs)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
