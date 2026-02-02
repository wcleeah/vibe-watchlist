import { formatDateOnly } from '@/lib/utils/format-utils'

import type { RecentActivity } from './types'

interface RecentActivityListProps {
    activities: RecentActivity[]
}

export function RecentActivityList({ activities }: RecentActivityListProps) {
    return (
        <div className='p-4 border border-gray-200'>
            <h3 className='text-lg font-semibold font-mono mb-4'>
                Recent Activity
            </h3>
            <div className='space-y-1'>
                {activities.length === 0 ? (
                    <div className='text-center py-4 text-gray-500 font-mono text-sm'>
                        No recent activity
                    </div>
                ) : (
                    activities.map((activity) => (
                        <div
                            key={`${activity.id}-${activity.action}`}
                            className='flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0'
                        >
                            <div className='flex-1'>
                                <div className='font-mono text-sm'>
                                    {activity.title}
                                </div>
                                <div className='text-xs text-gray-500 font-mono'>
                                    Watched {formatDateOnly(activity.watchedAt)}
                                </div>
                            </div>
                            <span className='text-sm font-mono'>
                                {activity.platform}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
