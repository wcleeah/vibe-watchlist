import type { UsageRequest } from '@/lib/types/usage'
import {
    formatDate,
    formatDuration,
    formatNumber,
} from '@/lib/utils/format-utils'

import { OPERATION_LABELS } from './types'

interface UsageRequestsTableProps {
    requests: UsageRequest[]
    selectedOperation: string
    onOperationChange: (operation: string) => void
    onRowClick: (request: UsageRequest) => void
}

export function UsageRequestsTable({
    requests,
    selectedOperation,
    onOperationChange,
    onRowClick,
}: UsageRequestsTableProps) {
    return (
        <div className='p-4 border border-gray-200'>
            <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold font-mono'>
                    Recent Requests
                </h3>
                <select
                    value={selectedOperation}
                    onChange={(e) => onOperationChange(e.target.value)}
                    className='px-3 py-1 border border-gray-300 rounded text-sm'
                >
                    <option value=''>All Operations</option>
                    {Object.keys(OPERATION_LABELS).map((op) => (
                        <option key={op} value={op}>
                            {OPERATION_LABELS[op]}
                        </option>
                    ))}
                </select>
            </div>
            <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                    <thead>
                        <tr className='border-b border-gray-200'>
                            <th className='text-left py-2 px-3 font-medium text-gray-600'>
                                Timestamp
                            </th>
                            <th className='text-left py-2 px-3 font-medium text-gray-600'>
                                Operation
                            </th>
                            <th className='text-right py-2 px-3 font-medium text-gray-600'>
                                Duration
                            </th>
                            <th className='text-right py-2 px-3 font-medium text-gray-600'>
                                Prompt
                            </th>
                            <th className='text-right py-2 px-3 font-medium text-gray-600'>
                                Completion
                            </th>
                            <th className='text-right py-2 px-3 font-medium text-gray-600'>
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className='text-center py-8 text-gray-500'
                                >
                                    No requests found
                                </td>
                            </tr>
                        ) : (
                            requests.map((req) => (
                                <tr
                                    key={req.id}
                                    className='border-b border-gray-100 hover:bg-gray-50 cursor-pointer'
                                    onClick={() => onRowClick(req)}
                                >
                                    <td className='py-2 px-3 font-mono text-xs'>
                                        {formatDate(req.createdAt)}
                                    </td>
                                    <td className='py-2 px-3 font-mono'>
                                        {OPERATION_LABELS[req.operation] ||
                                            req.operation}
                                    </td>
                                    <td className='py-2 px-3 text-right font-mono text-xs'>
                                        {formatDuration(req.durationMs)}
                                    </td>
                                    <td className='py-2 px-3 text-right font-mono'>
                                        {formatNumber(req.promptTokens)}
                                    </td>
                                    <td className='py-2 px-3 text-right font-mono'>
                                        {formatNumber(req.completionTokens)}
                                    </td>
                                    <td className='py-2 px-3 text-right font-mono font-semibold'>
                                        {formatNumber(req.totalTokens)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
