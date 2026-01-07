'use client'

import {
    Database,
    MonitorSpeaker,
    RefreshCw,
    Settings,
    Tag,
} from 'lucide-react'
import { useState } from 'react'
import { NavigationTabs } from '@/components/navigation-tabs'
import { CacheActions } from '@/components/settings/cache/cache-actions'
import { CacheEntries } from '@/components/settings/cache/cache-entries'
import { CacheStats } from '@/components/settings/cache/cache-stats'
import { PlatformForm } from '@/components/settings/platforms/platform-form'
import { PlatformList } from '@/components/settings/platforms/platform-list'

import { PlatformTester } from '@/components/settings/platforms/platform-tester'
import { TagsManager } from '@/components/settings/tags-manager'
import { Button } from '@/components/ui/button'

type TabId = 'cache' | 'platforms' | 'tags'

const tabs = [
    { id: 'cache' as TabId, label: 'Cache', icon: Database },
    { id: 'platforms' as TabId, label: 'Platforms', icon: MonitorSpeaker },
    { id: 'tags' as TabId, label: 'Tags', icon: Tag },
]

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<TabId>('cache')
    const [platformFormOpen, setPlatformFormOpen] = useState(false)
    const [editingPlatform, setEditingPlatform] = useState<any>(null)
    const [refreshing, setRefreshing] = useState(false)

    const handlePageRefresh = () => {
        setRefreshing(true)
        // Trigger refresh for current tab content
        window.location.reload()
    }

    const handleStatsRefresh = () => {
        // This will be called when cache operations complete
        // The individual components handle their own refresh logic
    }

    const handlePlatformEdit = (platform: any) => {
        setEditingPlatform(platform)
        setPlatformFormOpen(true)
    }

    const handlePlatformAdd = () => {
        setEditingPlatform(null)
        setPlatformFormOpen(true)
    }

    const handlePlatformSave = () => {
        // Refresh platform data - could be improved with proper state management
        window.location.reload()
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'cache':
                return (
                    <div className='space-y-6'>
                        <CacheStats />
                        <CacheActions onStatsRefresh={handleStatsRefresh} />
                        <CacheEntries onRefresh={handleStatsRefresh} />
                    </div>
                )
            case 'platforms':
                return (
                    <div className='space-y-6'>
                        <PlatformList
                            onEdit={handlePlatformEdit}
                            onAdd={handlePlatformAdd}
                            onRefresh={() => window.location.reload()}
                        />
                        <PlatformTester />
                    </div>
                )
            case 'tags':
                return <TagsManager />
            default:
                return null
        }
    }

    return (
        <div className='min-h-screen bg-background text-foreground'>
            <NavigationTabs />

            <main className='container mx-auto px-4 pt-32 pb-12 max-w-6xl'>
                {/* Header */}
                <div className='mb-8'>
                    <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center gap-3'>
                            <Settings className='w-8 h-8 text-gray-600 dark:text-gray-400' />
                            <h1 className='text-2xl sm:text-3xl font-bold'>
                                Settings
                            </h1>
                        </div>
                        <Button
                            onClick={handlePageRefresh}
                            disabled={refreshing}
                            variant='outline'
                            size='sm'
                            className='hidden sm:flex'
                        >
                            <RefreshCw
                                className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
                            />
                            Refresh Page
                        </Button>
                    </div>
                    <p className='text-gray-600 dark:text-gray-400'>
                        Manage application settings, cache, platforms, and tags
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className='border-b border-gray-200 dark:border-gray-800 mb-8'>
                    <nav className='flex flex-col sm:flex-row sm:space-x-8'>
                        {tabs.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type='button'
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-2 px-1 py-4 border-b-2 sm:border-b-2 font-medium text-sm transition-colors text-left ${
                                    activeTab === id
                                        ? 'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
                                        : 'border-transparent sm:border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                <Icon className='w-4 h-4 flex-shrink-0' />
                                {label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className='min-h-[400px]'>{renderTabContent()}</div>
            </main>

            {/* Platform Form Modal */}
            <PlatformForm
                platform={editingPlatform}
                isOpen={platformFormOpen}
                onClose={() => {
                    setPlatformFormOpen(false)
                    setEditingPlatform(null)
                }}
                onSave={handlePlatformSave}
            />
        </div>
    )
}
