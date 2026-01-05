'use client';

import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { NavigationTabs } from '@/components/navigation-tabs';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100">
      <NavigationTabs />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <AnalyticsDashboard />
      </main>
    </div>
  );
}