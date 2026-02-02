import { PLATFORM_NAMES } from '@/lib/utils/platform-utils'

interface PlatformStatsListProps {
    platformStats: Record<
        string,
        { total: number; watched: number; percentage: number }
    >
}

export function PlatformStatsList({ platformStats }: PlatformStatsListProps) {
    return (
        <div className='p-4 border border-gray-200'>
            <h3 className='text-lg font-semibold font-mono mb-4'>
                Platform Statistics
            </h3>
            <div className='space-y-2'>
                {Object.entries(platformStats).map(([platform, stat]) => (
                    <div
                        key={platform}
                        className='flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0'
                    >
                        <span className='font-mono text-sm'>
                            {PLATFORM_NAMES[
                                platform as keyof typeof PLATFORM_NAMES
                            ] || platform}
                        </span>
                        <div className='flex items-center gap-4 text-sm font-mono'>
                            <span>
                                {stat.watched}/{stat.total}
                            </span>
                            <span>{stat.percentage}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
