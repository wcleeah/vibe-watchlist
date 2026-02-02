import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { formatNumber } from '@/lib/utils/format-utils'

interface StatCardProps {
    value: number | string
    label: string
    icon?: LucideIcon
    iconColor?: string
}

export function StatCard({
    value,
    label,
    icon: Icon,
    iconColor,
}: StatCardProps) {
    const displayValue = typeof value === 'number' ? formatNumber(value) : value

    return (
        <div className='p-4 border border-gray-200'>
            <div className='flex items-center gap-2'>
                {Icon && <Icon className={`w-4 h-4 ${iconColor || ''}`} />}
                <div className='text-2xl font-bold font-mono'>
                    {displayValue}
                </div>
            </div>
            <div className='text-sm text-gray-600'>{label}</div>
        </div>
    )
}
