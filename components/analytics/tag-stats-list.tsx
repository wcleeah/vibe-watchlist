interface TagStatsListProps {
    tagStats: Record<
        string,
        { total: number; watched: number; percentage: number }
    >
    /** Maximum number of tags to display */
    limit?: number
}

export function TagStatsList({ tagStats, limit = 10 }: TagStatsListProps) {
    const sortedTags = Object.entries(tagStats)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, limit)

    return (
        <div className='p-4 border border-gray-200'>
            <h3 className='text-lg font-semibold font-mono mb-4'>
                Tag Statistics
            </h3>
            <div className='space-y-1'>
                {sortedTags.map(([tag, stat]) => (
                    <div
                        key={tag}
                        className='flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0'
                    >
                        <span className='font-mono text-sm'>#{tag}</span>
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
