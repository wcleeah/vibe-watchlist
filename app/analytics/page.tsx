'use client';

import { useEffect } from 'react';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { NavigationTabs } from '@/components/navigation-tabs';
import { useAnalytics } from '@/lib/analytics-context';

export default function AnalyticsPage() {
  const { countdown, refreshStats } = useAnalytics();

  // Ensure fresh data on page entry
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavigationTabs />

      <main className="container mx-auto px-4 pt-32 pb-12 max-w-6xl">
        <div className="mb-6 text-right">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Next update in {countdown}s
          </span>
        </div>
        <AnalyticsDashboard />
      </main>
    </div>
  );
}