'use client';

import { useAnalytics } from '@/lib/analytics-context';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { PLATFORM_NAMES } from '@/lib/utils/platform-utils';



export function AnalyticsDashboard() {
  const { stats, refreshStats, isLoading } = useAnalytics();

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
            <h2 className="text-2xl font-bold text-black dark:text-white font-mono">📊 Analytics Dashboard</h2>
          </div>
          <Button onClick={refreshStats} disabled={isLoading} variant="outline" className="h-8 text-xs px-2">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            refresh()
          </Button>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <div className="text-gray-500 font-mono text-sm italic">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
          <h2 className="text-2xl font-bold text-black dark:text-white font-mono">📊 Analytics Dashboard</h2>
        </div>
        <Button onClick={refreshStats} disabled={isLoading} variant="outline" className="h-8 text-xs px-2">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          refresh()
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="pb-3 border-b border-gray-300 dark:border-gray-600 mb-4">
          <h3 className="text-lg font-bold text-black dark:text-white font-mono">📊 Analytics Overview</h3>
        </div>
        <div className="font-mono text-sm">
          {'{'}
          <div className="ml-4 space-y-1">
            <div><span className="text-purple-600 dark:text-purple-400">"TOTAL_VIDEOS"</span>: <span className="text-green-600 dark:text-green-400">{stats.totalVideos}</span>,</div>
            <div><span className="text-purple-600 dark:text-purple-400">"WATCHED"</span>: <span className="text-green-600 dark:text-green-400">{stats.watchedVideos}</span>,</div>
            <div><span className="text-purple-600 dark:text-purple-400">"TO_WATCH"</span>: <span className="text-green-600 dark:text-green-400">{stats.unwatchedVideos}</span>,</div>
            <div><span className="text-purple-600 dark:text-purple-400">"COMPLETION_RATE"</span>: <span className="text-yellow-600 dark:text-yellow-400">"{stats.watchProgress}%"</span></div>
          </div>
          {'}'}
        </div>
      </div>

      {/* Platform Statistics */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="pb-3 border-b border-gray-300 dark:border-gray-600 mb-4">
          <h3 className="text-lg font-bold text-black dark:text-white font-mono">🎬 Platform Statistics</h3>
        </div>
        <div className="font-mono text-sm">
          {'{'}
          <div className="ml-4 space-y-1">
            {Object.entries(stats.platformStats).map(([platform, stat]) => (
              <div key={platform}>
                <span className="text-purple-600 dark:text-purple-400">"{PLATFORM_NAMES[platform as keyof typeof PLATFORM_NAMES] || platform}"</span>: {'{'}
                <span className="text-green-600 dark:text-green-400 ml-4">"watched": {stat.watched}, "total": {stat.total}, "percentage": "{stat.percentage}%"</span>
                {'}'}{Object.entries(stats.platformStats).length > 1 ? ',' : ''}
              </div>
            ))}
          </div>
          {'}'}
        </div>
      </div>

      {/* Tag Statistics */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="pb-3 border-b border-gray-300 dark:border-gray-600 mb-4">
          <h3 className="text-lg font-bold text-black dark:text-white font-mono">🏷️ Tag Statistics</h3>
        </div>
        <div className="font-mono text-sm">
          {'{'}
          <div className="ml-4 space-y-1">
            {Object.entries(stats.tagStats)
              .sort(([, a], [, b]) => b.total - a.total)
              .slice(0, 10)
              .map(([tag, stat]) => (
                <div key={tag}>
                  <span className="text-purple-600 dark:text-purple-400">"{tag}"</span>: {'{'}
                  <span className="text-green-600 dark:text-green-400 ml-4">"watched": {stat.watched}, "total": {stat.total}, "percentage": "{stat.percentage}%"</span>
                  {'}'}{Object.entries(stats.tagStats).slice(0, 10).length > 1 ? ',' : ''}
                </div>
              ))}
          </div>
          {'}'}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="pb-3 border-b border-gray-300 dark:border-gray-600 mb-4">
          <h3 className="text-lg font-bold text-black dark:text-white font-mono">📈 Recent Activity</h3>
        </div>
        <div className="font-mono text-sm">
          {stats.recentActivity.length === 0 ? (
            <div className="text-gray-500 italic">No recent activity</div>
          ) : (
            <>
              {'['}
              <div className="ml-4 space-y-1">
                {stats.recentActivity.map((activity, index) => (
                  <div key={`${activity.id}-${activity.action}`}>
                    {'{'}
                    <div className="ml-4 space-y-1">
                      <div><span className="text-purple-600 dark:text-purple-400">"title"</span>: <span className="text-green-600 dark:text-green-400">"{activity.title}"</span>,</div>
                      <div><span className="text-purple-600 dark:text-purple-400">"platform"</span>: <span className="text-green-600 dark:text-green-400">"{activity.platform}"</span>,</div>
                      <div><span className="text-purple-600 dark:text-purple-400">"watchedAt"</span>: <span className="text-yellow-600 dark:text-yellow-400">"{new Date(activity.watchedAt).toLocaleDateString()}"</span></div>
                    </div>
                    {'}'}{index < stats.recentActivity.length - 1 ? ',' : ''}
                  </div>
                ))}
              </div>
              {']'}
            </>
          )}
        </div>
      </div>
    </div>
  );
}