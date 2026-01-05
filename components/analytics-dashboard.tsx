'use client';

import { useAnalytics } from '@/lib/analytics-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Youtube, Tv, Gamepad2, RefreshCw, TrendingUp, Calendar, Tag, Play } from 'lucide-react';
import { PLATFORM_NAMES } from '@/lib/utils/platform-utils';

const platformIcons = {
  youtube: Youtube,
  netflix: Tv,
  nebula: Tv,
  twitch: Gamepad2,
};

export function AnalyticsDashboard() {
  const { stats, refreshStats, isLoading } = useAnalytics();

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics</h2>
          <Button onClick={refreshStats} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <div className="text-center py-8 text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <Button onClick={refreshStats} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Play className="w-8 h-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{stats.totalVideos}</div>
              <div className="text-sm text-gray-500">Total Videos</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{stats.watchedVideos}</div>
              <div className="text-sm text-gray-500">Watched</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-orange-500" />
            <div>
              <div className="text-2xl font-bold">{stats.unwatchedVideos}</div>
              <div className="text-sm text-gray-500">To Watch</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-green-500 flex items-center justify-center">
              <div className="text-xs font-bold text-green-600">{stats.watchProgress}%</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.watchProgress}%</div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Platform Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Tv className="w-5 h-5" />
          Platform Statistics
        </h3>
        <div className="space-y-3">
          {Object.entries(stats.platformStats).map(([platform, stat]) => {
            const Icon = platformIcons[platform as keyof typeof platformIcons] || Tv;
            return (
              <div key={platform} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">{PLATFORM_NAMES[platform as keyof typeof PLATFORM_NAMES] || platform}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span>{stat.watched}/{stat.total} watched</span>
                  <Badge variant={stat.percentage === 100 ? "default" : stat.percentage > 50 ? "secondary" : "outline"}>
                    {stat.percentage}%
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Tag Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Tag Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(stats.tagStats)
            .sort(([, a], [, b]) => b.total - a.total)
            .slice(0, 10)
            .map(([tag, stat]) => (
              <div key={tag} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="font-medium">#{tag}</span>
                <div className="flex items-center gap-2 text-sm">
                  <span>{stat.watched}/{stat.total}</span>
                  <Badge variant={stat.percentage === 100 ? "default" : "secondary"}>
                    {stat.percentage}%
                  </Badge>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {stats.recentActivity.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No recent activity</div>
          ) : (
            stats.recentActivity.map((activity) => {
              const Icon = platformIcons[activity.platform as keyof typeof platformIcons] || Tv;
              return (
                <div key={`${activity.id}-${activity.action}`} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Icon className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{activity.title}</div>
                    <div className="text-xs text-gray-500">
                      Watched {new Date(activity.watchedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.platform}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}