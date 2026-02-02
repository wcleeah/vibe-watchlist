'use client'

import { Archive, CalendarDays } from 'lucide-react'
import type { ReactNode } from 'react'

type BannerType = 'backlog' | 'dates'

interface ScheduleInfoBannerProps {
    type: BannerType
}

const bannerConfig: Record<
    BannerType,
    { icon: ReactNode; className: string; message: string }
> = {
    backlog: {
        icon: (
            <Archive className='w-4 h-4 text-amber-600 dark:text-amber-400' />
        ),
        className:
            'flex items-center gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800',
        message:
            'Backlog series have no release schedule. Track your progress manually.',
    },
    dates: {
        icon: (
            <CalendarDays className='w-4 h-4 text-blue-600 dark:text-blue-400' />
        ),
        className:
            'flex items-center gap-2 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800',
        message: 'Add specific release dates with episode counts.',
    },
}

/**
 * Informational banner for different schedule types
 */
export function ScheduleInfoBanner({ type }: ScheduleInfoBannerProps) {
    const config = bannerConfig[type]

    return (
        <div className={config.className}>
            {config.icon}
            <span
                className={`text-sm ${
                    type === 'backlog'
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-blue-700 dark:text-blue-300'
                }`}
            >
                {config.message}
            </span>
        </div>
    )
}
