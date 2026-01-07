'use client'

import { RefreshCw, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/lib/analytics-context'
import { PLATFORM_NAMES } from '@/lib/utils/platform-utils'
import { EventAnalyticsSection } from '@/components/analytics/event-analytics-section'
import { useState } from 'react'

export function AnalyticsDashboard() {
    const { stats, refreshStats, isLoading } = useAnalytics()
    const [activeTab, setActiveTab] = useState<'live' | 'events'>('live')

    if (!stats) {
        return (
            <div className='space-y-6'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <TrendingUp className='w-5 h-5' />
                        <h2 className='text-xl font-semibold'>Analytics</h2>
                    </div>
                    <Button
                        onClick={refreshStats}
                        disabled={isLoading}
                        variant='outline'
                        size='sm'
                    >
                        <RefreshCw
                            className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                        />
                        Refresh
                    </Button>
                </div>
                <div className='text-center py-8 text-gray-500'>
                    Loading analytics...
                </div>
            </div>
        )
    }

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <h2 className='text-2xl font-bold font-mono'>Analytics</h2>
                <Button
                    onClick={refreshStats}
                    disabled={isLoading}
                    variant='outline'
                    size='sm'
                >
                    <RefreshCw
                        className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                    />
                    Refresh
                </Button>
            </div>

            <div className='space-y-4'>
                <div className='flex border-b'>
                    <button
                        onClick={() => setActiveTab('live')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'live'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                        type='button'
                    >
                        Live Stats
                    </button>
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'events'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                        type='button'
                    >
                        Event Analytics
                    </button>
                </div>

                {activeTab === 'live' && (
                    <div className='space-y-6'>
                        {/* Overview Stats */}
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                            <div className='p-4 border border-gray-200'>
                                <div className='text-2xl font-bold font-mono'>
                                    {stats.totalVideos}
                                </div>
                                <div className='text-sm text-gray-600'>
                                    Total Videos
                                </div>
                            </div>

                            <div className='p-4 border border-gray-200'>
                                <div className='text-2xl font-bold font-mono'>
                                    {stats.watchedVideos}
                                </div>
                                <div className='text-sm text-gray-600'>
                                    Watched
                                </div>
                            </div>

                            <div className='p-4 border border-gray-200'>
                                <div className='text-2xl font-bold font-mono'>
                                    {stats.unwatchedVideos}
                                </div>
                                <div className='text-sm text-gray-600'>
                                    To Watch
                                </div>
                            </div>

                            <div className='p-4 border border-gray-200'>
                                <div className='text-2xl font-bold font-mono'>
                                    {stats.watchProgress}%
                                </div>
                                <div className='text-sm text-gray-600'>
                                    Complete
                                </div>
                            </div>
                        </div>

                        {/* Platform Statistics */}
                        <div className='p-4 border border-gray-200'>
                            <h3 className='text-lg font-semibold font-mono mb-4'>
                                Platform Statistics
                            </h3>
                            <div className='space-y-2'>
                                {Object.entries(stats.platformStats).map(
                                    ([platform, stat]) => (
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
                                    ),
                                )}
                            </div>
                        </div>

                        {/* Tag Statistics */}
                        <div className='p-4 border border-gray-200'>
                            <h3 className='text-lg font-semibold font-mono mb-4'>
                                Tag Statistics
                            </h3>
                            <div className='space-y-1'>
                                {Object.entries(stats.tagStats)
                                    .sort(([, a], [, b]) => b.total - a.total)
                                    .slice(0, 10)
                                    .map(([tag, stat]) => (
                                        <div
                                            key={tag}
                                            className='flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0'
                                        >
                                            <span className='font-mono text-sm'>
                                                #{tag}
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

                        {/* Recent Activity */}
                        <div className='p-4 border border-gray-200'>
                            <h3 className='text-lg font-semibold font-mono mb-4'>
                                Recent Activity
                            </h3>
                            <div className='space-y-1'>
                                {stats.recentActivity.length === 0 ? (
                                    <div className='text-center py-4 text-gray-500 font-mono text-sm'>
                                        No recent activity
                                    </div>
                                ) : (
                                    stats.recentActivity.map((activity) => (
                                        <div
                                            key={`${activity.id}-${activity.action}`}
                                            className='flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0'
                                        >
                                            <div className='flex-1'>
                                                <div className='font-mono text-sm'>
                                                    {activity.title}
                                                </div>
                                                <div className='text-xs text-gray-500 font-mono'>
                                                    Watched{' '}
                                                    {new Date(
                                                        activity.watchedAt,
                                                    ).toLocaleDateString()}
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
                    </div>
                )}

                {activeTab === 'events' && <EventAnalyticsSection />}
            </div>
        </div>
    )
}
