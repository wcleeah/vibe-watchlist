'use client'

import { CheckCircle2, ListMusic, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import { NavigationTabs } from '@/components/navigation-tabs'
import { PlaylistCard } from '@/components/playlists/playlist-card'
import { PlaylistItemsModal } from '@/components/playlists/playlist-items-modal'
import {
    ErrorDisplay,
    FilterBar,
    type SortOption,
    TabSwitcher,
} from '@/components/shared'
import { usePlaylists } from '@/hooks/use-playlists'
import type { PlaylistFilters, PlaylistSummary } from '@/types/playlist'

type TabType = 'active' | 'completed'

const SORT_OPTIONS: SortOption[] = [
    { value: 'progress-asc', label: 'Least Progress' },
    { value: 'progress-desc', label: 'Most Progress' },
    { value: 'createdAt-desc', label: 'Newest First' },
    { value: 'createdAt-asc', label: 'Oldest First' },
    { value: 'title-asc', label: 'Title A-Z' },
    { value: 'title-desc', label: 'Title Z-A' },
]

export default function PlaylistsPage() {
    const searchParams = useSearchParams()
    const initialTab =
        searchParams.get('tab') === 'completed' ? 'completed' : 'active'

    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>(initialTab)

    // Filter state
    const [searchQuery, setSearchQuery] = useState('')
    const [sortValue, setSortValue] = useState('progress-asc')

    // Modal state
    const [selectedPlaylist, setSelectedPlaylist] =
        useState<PlaylistSummary | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Build filters for active playlists (has unwatched videos)
    const activeFilters: PlaylistFilters = useMemo(
        () => ({
            search: searchQuery || undefined,
            isCompleted: false,
        }),
        [searchQuery],
    )

    // Build filters for completed playlists
    const completedFilters: PlaylistFilters = useMemo(
        () => ({
            search: searchQuery || undefined,
            isCompleted: true,
        }),
        [searchQuery],
    )

    // Data hooks for both tabs
    const activePlaylists = usePlaylists({ filters: activeFilters })
    const completedPlaylists = usePlaylists({ filters: completedFilters })

    // Current hook based on active tab
    const currentHook =
        activeTab === 'active' ? activePlaylists : completedPlaylists

    // Client-side sorting
    const sortedPlaylists = useMemo(() => {
        const playlists = [...currentHook.playlists]
        const [sortBy, sortOrder] = sortValue.split('-') as [
            string,
            'asc' | 'desc',
        ]

        playlists.sort((a, b) => {
            let comparison = 0

            switch (sortBy) {
                case 'progress': {
                    const progressA =
                        a.itemCount > 0
                            ? (a.watchedCount / a.itemCount) * 100
                            : 0
                    const progressB =
                        b.itemCount > 0
                            ? (b.watchedCount / b.itemCount) * 100
                            : 0
                    comparison = progressA - progressB
                    break
                }
                case 'createdAt': {
                    const dateA = a.createdAt
                        ? new Date(a.createdAt).getTime()
                        : 0
                    const dateB = b.createdAt
                        ? new Date(b.createdAt).getTime()
                        : 0
                    comparison = dateA - dateB
                    break
                }
                case 'title':
                    comparison = (a.title || '').localeCompare(b.title || '')
                    break
                default:
                    comparison = 0
            }

            return sortOrder === 'desc' ? -comparison : comparison
        })

        return playlists
    }, [currentHook.playlists, sortValue])

    // Handlers
    const handleClearAll = () => {
        setSearchQuery('')
    }

    const handleViewItems = (playlist: PlaylistSummary) => {
        setSelectedPlaylist(playlist)
        setIsModalOpen(true)
    }

    const handleRefresh = useCallback(() => {
        activePlaylists.refetch()
        completedPlaylists.refetch()
    }, [activePlaylists, completedPlaylists])

    // Tab configuration
    const tabs = [
        {
            id: 'active',
            label: 'Active',
            icon: <ListMusic className='w-4 h-4' />,
            count: activePlaylists.playlists.length,
        },
        {
            id: 'completed',
            label: 'Completed',
            icon: <CheckCircle2 className='w-4 h-4' />,
            count: completedPlaylists.playlists.length,
        },
    ]

    return (
        <div className='min-h-screen bg-background text-foreground'>
            <NavigationTabs />

            <main className='container mx-auto px-4 pt-32 pb-12 max-w-6xl'>
                {/* Header */}
                <div className='mb-8'>
                    <div className='flex items-center gap-2 mb-2'>
                        <ListMusic className='w-8 h-8' />
                        <h1 className='text-2xl sm:text-3xl font-bold'>
                            My Playlists
                        </h1>
                    </div>
                    <p className='text-gray-600 dark:text-gray-400'>
                        {activePlaylists.playlists.length +
                            completedPlaylists.playlists.length}{' '}
                        playlists tracked
                        {activePlaylists.playlists.length > 0 &&
                            ` - ${activePlaylists.playlists.length} in progress`}
                    </p>
                </div>

                {/* Error display */}
                {currentHook.error && (
                    <ErrorDisplay
                        error={currentHook.error}
                        onRetry={currentHook.refetch}
                        className='mb-4'
                    />
                )}

                {/* Tabs */}
                <TabSwitcher
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={(tab) => setActiveTab(tab as TabType)}
                    className='mb-6'
                />

                {/* Filter Bar */}
                <FilterBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder='Search playlists...'
                    platforms={[]}
                    selectedPlatforms={[]}
                    onPlatformToggle={() => {}}
                    tags={[]}
                    selectedTagIds={[]}
                    onTagToggle={() => {}}
                    sortOptions={SORT_OPTIONS}
                    sortValue={sortValue}
                    onSortChange={setSortValue}
                    onClearAll={handleClearAll}
                    className='mb-6'
                />

                {/* Playlist List */}
                {currentHook.loading ? (
                    <div className='flex items-center justify-center py-12'>
                        <Loader2 className='w-8 h-8 animate-spin text-gray-500' />
                    </div>
                ) : sortedPlaylists.length === 0 ? (
                    <div className='text-center py-12'>
                        <p className='text-gray-500 dark:text-gray-400 mb-2'>
                            {activeTab === 'active'
                                ? 'No active playlists'
                                : 'No completed playlists'}
                        </p>
                        <p className='text-sm text-gray-400 dark:text-gray-500'>
                            {activeTab === 'active'
                                ? 'Import a YouTube playlist from the home page to get started'
                                : 'Complete a playlist by watching all its videos'}
                        </p>
                    </div>
                ) : (
                    <div className='space-y-4'>
                        {sortedPlaylists.map((playlist) => (
                            <PlaylistCard
                                key={playlist.id}
                                playlist={playlist}
                                onViewItems={handleViewItems}
                                onSync={currentHook.sync}
                                onDelete={currentHook.deletePlaylist}
                            />
                        ))}
                    </div>
                )}

                {/* Items Modal */}
                <PlaylistItemsModal
                    playlist={selectedPlaylist}
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    onRefresh={handleRefresh}
                />
            </main>
        </div>
    )
}
