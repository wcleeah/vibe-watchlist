import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import type { UsageRequest } from '@/lib/types/usage'
import { formatDate } from '@/lib/utils/format-utils'

import { OPERATION_LABELS } from './types'

interface RequestDetailModalProps {
    request: UsageRequest | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function RequestDetailModal({
    request,
    open,
    onOpenChange,
}: RequestDetailModalProps) {
    const formatJson = (text: string | null): string => {
        if (!text) return 'N/A'
        try {
            return JSON.stringify(JSON.parse(text), null, 2)
        } catch {
            return text
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='!w-[90vw] !max-w-[1200px]'>
                <DialogHeader>
                    <DialogTitle className='font-mono text-base'>
                        Request Details
                    </DialogTitle>
                </DialogHeader>
                {request && (
                    <div className='space-y-4'>
                        <div className='grid grid-cols-2 gap-4 text-sm'>
                            <div>
                                <span className='text-gray-600'>
                                    Operation:
                                </span>
                                <span className='ml-2 font-mono'>
                                    {OPERATION_LABELS[request.operation] ||
                                        request.operation}
                                </span>
                            </div>
                            <div>
                                <span className='text-gray-600'>Model:</span>
                                <span className='ml-2 font-mono text-xs'>
                                    {request.model}
                                </span>
                            </div>
                            <div>
                                <span className='text-gray-600'>
                                    Timestamp:
                                </span>
                                <span className='ml-2 font-mono text-xs'>
                                    {formatDate(request.createdAt)}
                                </span>
                            </div>
                            <div>
                                <span className='text-gray-600'>Tokens:</span>
                                <span className='ml-2 font-mono text-xs'>
                                    {request.promptTokens} /{' '}
                                    {request.completionTokens} /{' '}
                                    {request.totalTokens}
                                </span>
                            </div>
                            {request.durationMs && (
                                <div>
                                    <span className='text-gray-600'>
                                        Duration:
                                    </span>
                                    <span className='ml-2 font-mono text-xs'>
                                        {(request.durationMs / 1000).toFixed(3)}
                                        s
                                    </span>
                                </div>
                            )}
                        </div>

                        <div>
                            <h4 className='font-medium text-sm mb-2 flex items-center gap-2'>
                                <ArrowDownToLine className='w-4 h-4 text-blue-500' />
                                Prompt
                            </h4>
                            <pre className='bg-gray-100 p-3 rounded text-xs overflow-x-auto font-mono max-h-64 whitespace-pre-wrap break-all'>
                                {formatJson(request.promptText)}
                            </pre>
                        </div>

                        <div>
                            <h4 className='font-medium text-sm mb-2 flex items-center gap-2'>
                                <ArrowUpFromLine className='w-4 h-4 text-green-500' />
                                Completion
                            </h4>
                            <pre className='bg-gray-100 p-3 rounded text-xs overflow-x-auto font-mono max-h-64 whitespace-pre-wrap break-all'>
                                {formatJson(request.completionText)}
                            </pre>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
