'use client';

import { useState } from 'react';
import { Settings, Database, MonitorSpeaker, Tag } from 'lucide-react';
import { NavigationTabs } from '@/components/navigation-tabs';
import { CacheStats } from '@/components/settings/cache/cache-stats';
import { CacheActions } from '@/components/settings/cache/cache-actions';
import { CacheEntries } from '@/components/settings/cache/cache-entries';

type TabId = 'cache' | 'platforms' | 'tags';

const tabs = [
  { id: 'cache' as TabId, label: 'Cache', icon: Database },
  { id: 'platforms' as TabId, label: 'Platforms', icon: MonitorSpeaker },
  { id: 'tags' as TabId, label: 'Tags', icon: Tag },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('cache');

  const handleStatsRefresh = () => {
    // This will be called when cache operations complete
    // The individual components handle their own refresh logic
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'cache':
        return (
          <div className="space-y-6">
            <CacheStats />
            <CacheActions onStatsRefresh={handleStatsRefresh} />
            <CacheEntries onRefresh={handleStatsRefresh} />
          </div>
        );
      case 'platforms':
        return (
          <div className="space-y-6">
            <div className="text-center py-12">
              <MonitorSpeaker className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Platform Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Add, edit, and manage video platforms. Configure patterns, icons, and display settings.
              </p>
            </div>
          </div>
        );
      case 'tags':
        return (
          <div className="space-y-6">
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Tag Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Create, edit, and organize tags for categorizing your videos.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavigationTabs />

      <main className="container mx-auto px-4 pt-32 pb-12 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage application settings, cache, platforms, and tags
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-800 mb-8">
          <nav className="flex space-x-8">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}