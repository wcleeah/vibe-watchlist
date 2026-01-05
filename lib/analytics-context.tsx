'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface WatchStats {
  totalVideos: number;
  watchedVideos: number;
  unwatchedVideos: number;
  watchProgress: number; // percentage 0-100
  platformStats: Record<string, {
    total: number;
    watched: number;
    percentage: number;
  }>;
  tagStats: Record<string, {
    total: number;
    watched: number;
    percentage: number;
  }>;
  recentActivity: Array<{
    id: number;
    title: string;
    platform: string;
    watchedAt: string;
    action: 'added' | 'watched';
  }>;
}

const AnalyticsContext = createContext<{
  stats: WatchStats | null;
  refreshStats: () => Promise<void>;
  isLoading: boolean;
  countdown: number;
} | null>(null);

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [stats, setStats] = useState<WatchStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(15);

  const refreshStats = async () => {
    setIsLoading(true);
    try {
      // Fetch all videos with tags
      const response = await fetch('/api/videos?limit=1000');
      if (!response.ok) {
        throw new Error('Failed to fetch videos for analytics');
      }

      const videos = await response.json();

      // Calculate basic stats
      const totalVideos = videos.length;
      const watchedVideos = videos.filter((v: { isWatched: boolean }) => v.isWatched).length;
      const unwatchedVideos = totalVideos - watchedVideos;
      const watchProgress = totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : 0;

      // Calculate platform stats
      const platformStats: Record<string, { total: number; watched: number; percentage: number }> = {};
      videos.forEach((video: { platform: string; isWatched: boolean }) => {
        const platform = video.platform;
        if (!platformStats[platform]) {
          platformStats[platform] = { total: 0, watched: 0, percentage: 0 };
        }
        platformStats[platform].total++;
        if (video.isWatched) {
          platformStats[platform].watched++;
        }
      });

      // Calculate percentages for platform stats
      Object.keys(platformStats).forEach(platform => {
        const stat = platformStats[platform];
        stat.percentage = stat.total > 0 ? Math.round((stat.watched / stat.total) * 100) : 0;
      });

      // Calculate tag stats
      const tagStats: Record<string, { total: number; watched: number; percentage: number }> = {};
      videos.forEach((video: { tags?: Array<{ name: string }>; isWatched: boolean }) => {
        if (video.tags) {
          video.tags.forEach((tag: { name: string }) => {
            const tagName = tag.name;
            if (!tagStats[tagName]) {
              tagStats[tagName] = { total: 0, watched: 0, percentage: 0 };
            }
            tagStats[tagName].total++;
            if (video.isWatched) {
              tagStats[tagName].watched++;
            }
          });
        }
      });

      // Calculate percentages for tag stats
      Object.keys(tagStats).forEach(tag => {
        const stat = tagStats[tag];
        stat.percentage = stat.total > 0 ? Math.round((stat.watched / stat.total) * 100) : 0;
      });

      // Get recent activity (last 10 watched videos)
      const recentActivity = videos
        .filter((v: { isWatched: boolean }) => v.isWatched)
        .sort((a: { updatedAt: string }, b: { updatedAt: string }) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10)
        .map((video: { id: number; title: string | null; platform: string; updatedAt: string }) => ({
          id: video.id,
          title: video.title || 'Untitled',
          platform: video.platform,
          watchedAt: video.updatedAt,
          action: 'watched' as const,
        }));

      setStats({
        totalVideos,
        watchedVideos,
        unwatchedVideos,
        watchProgress,
        platformStats,
        tagStats,
        recentActivity,
      });
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  // Polling every 15 seconds with countdown
  useEffect(() => {
    // Start countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => prev > 1 ? prev - 1 : 15);
    }, 1000);

    // Polling
    const pollInterval = setInterval(() => {
      refreshStats();
    }, 15000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(pollInterval);
    };
  }, []);

  return (
    <AnalyticsContext.Provider value={{ stats, refreshStats, isLoading, countdown }}>
      {children}
    </AnalyticsContext.Provider>
  );
}