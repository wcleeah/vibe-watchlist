'use client'

import { CheckCircle2, ListMusic } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { NavigationTabs } from '@/components/navigation-tabs'
import { PlaylistEditModal } from '@/components/playlists/playlist-edit-modal'
import { PlaylistItemsModal } from '@/components/playlists/playlist-items-modal'
import { PlaylistList } from '@/components/playlists/playlist-list'
import {
    ErrorDisplay,
    FilterBar,
    type SortOption,
    TabSwitcher,
} from '@/components/shared'
import { usePlatformsWithIcons } from '@/hooks/use-platforms-with-icons'
import { usePlaylists } from '@/hooks/use-playlists'
import { useTags } from '@/hooks/use-tags'
import type { PlaylistFilters, PlaylistSummary } from '@/types/playlist'

type TabType = 'active' | 'completed'

const SORT_OPTIONS: SortOption[] = [
    { value: 'custom', label: 'Custom Order' },
    { value: 'progress-asc', label: 'Least Progress' },
    { value: 'progress-desc', label: 'Most Progress' },
    { value: 'createdAt-desc', label: 'Newest First' },
    { value: 'createdAt-asc', label: 'Oldest First' },
    { value: 'title-asc', label: 'Title A-Z' },
    { value: 'title-desc', label: 'Title Z-A' },
]

export default function PlaylistsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialTab =
        searchParams.get('tab') === 'completed' ? 'completed' : 'active'

    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>(initialTab)

    // Filter state
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
    const [sortValue, setSortValue] = useState('custom')

    // Check if custom order is selected (for drag-drop)
    const isCustomOrder = sortValue === 'custom'

    // Parse sortBy for API - extract the field name (e.g., 'progress' from 'progress-asc')
    const sortBy = isCustomOrder
        ? 'custom'
        : (sortValue.split('-')[0] as 'progress' | 'createdAt' | 'title')

    // Modal state
    const [selectedPlaylist, setSelectedPlaylist] =
        useState<PlaylistSummary | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Edit modal state
    const [editingPlaylist, setEditingPlaylist] =
        useState<PlaylistSummary | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    // Platform and tag data
    const { platforms } = usePlatformsWithIcons()
    const { tags: allTags } = useTags()

    // Build filters for active playlists (has unwatched videos)
    const activeFilters: PlaylistFilters = useMemo(
        () => ({
            search: searchQuery || undefined,
            isCompleted: false,
            platform:
                selectedPlatforms.length === 1
                    ? selectedPlatforms[0]
                    : undefined,
            tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
            sortBy,
        }),
        [searchQuery, selectedPlatforms, selectedTagIds, sortBy],
    )

    // Build filters for completed playlists
    const completedFilters: PlaylistFilters = useMemo(
        () => ({
            search: searchQuery || undefined,
            isCompleted: true,
            platform:
                selectedPlatforms.length === 1
                    ? selectedPlatforms[0]
                    : undefined,
            tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
            sortBy,
        }),
        [searchQuery, selectedPlatforms, selectedTagIds, sortBy],
    )

    // Data hooks for both tabs
    const activePlaylists = usePlaylists({ filters: activeFilters })
    const completedPlaylists = usePlaylists({ filters: completedFilters })

    // Current hook based on active tab
    const currentHook =
        activeTab === 'active' ? activePlaylists : completedPlaylists

    // Client-side sorting (skip if custom order - use DB sortOrder)
    const sortedPlaylists = useMemo(() => {
        const playlists = [...currentHook.playlists]

        // Custom order uses sortOrder from the database
        if (isCustomOrder) {
            return playlists
        }

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
    }, [currentHook.playlists, sortValue, isCustomOrder])

    // Client-side tag filtering (for multi-platform selection)
    const filteredPlaylists = useMemo(() => {
        let result = sortedPlaylists

        // Filter by multiple platforms if more than one selected
        if (selectedPlatforms.length > 1) {
            result = result.filter((playlist) =>
                selectedPlatforms.includes(playlist.platform),
            )
        }

        return result
    }, [sortedPlaylists, selectedPlatforms])

    // Handlers
    const handlePlatformToggle = (platform: string) => {
        setSelectedPlatforms((prev) =>
            prev.includes(platform)
                ? prev.filter((p) => p !== platform)
                : [...prev, platform],
        )
    }

    const handleTagToggle = (tagId: number) => {
        setSelectedTagIds((prev) =>
            prev.includes(tagId)
                ? prev.filter((id) => id !== tagId)
                : [...prev, tagId],
        )
    }

    const handleClearAll = () => {
        setSearchQuery('')
        setSelectedPlatforms([])
        setSelectedTagIds([])
    }

    // Handle tab change - updates state and URL
    const handleTabChange = useCallback(
        (tab: string) => {
            setActiveTab(tab as TabType)
            const params = new URLSearchParams(searchParams.toString())
            if (tab === 'active') {
                params.delete('tab')
            } else {
                params.set('tab', tab)
            }
            const queryString = params.toString()
            router.push(`/playlists${queryString ? `?${queryString}` : ''}`, {
                scroll: false,
            })
        },
        [router, searchParams],
    )

    const handleViewItems = (playlist: PlaylistSummary) => {
        setSelectedPlaylist(playlist)
        setIsModalOpen(true)
    }

    const handleEdit = (playlist: PlaylistSummary) => {
        setEditingPlaylist(playlist)
        setIsEditModalOpen(true)
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
                    onTabChange={handleTabChange}
                    className='mb-6'
                />

                {/* Filter Bar */}
                <FilterBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder='Search playlists...'
                    platforms={platforms}
                    selectedPlatforms={selectedPlatforms}
                    onPlatformToggle={handlePlatformToggle}
                    tags={allTags}
                    selectedTagIds={selectedTagIds}
                    onTagToggle={handleTagToggle}
                    sortOptions={SORT_OPTIONS}
                    sortValue={sortValue}
                    onSortChange={setSortValue}
                    onClearAll={handleClearAll}
                    className='mb-6'
                />

                {/* Playlist List */}
                <PlaylistList
                    playlists={filteredPlaylists}
                    loading={currentHook.loading}
                    onViewItems={handleViewItems}
                    onEdit={handleEdit}
                    onSync={currentHook.sync}
                    onDelete={currentHook.deletePlaylist}
                    onReorder={
                        isCustomOrder
                            ? activeTab === 'active'
                                ? activePlaylists.reorderPlaylists
                                : completedPlaylists.reorderPlaylists
                            : undefined
                    }
                    emptyState={{
                        title:
                            activeTab === 'active'
                                ? 'No active playlists'
                                : 'No completed playlists',
                        description:
                            activeTab === 'active'
                                ? 'Import a YouTube playlist from the home page to get started'
                                : 'Complete a playlist by watching all its videos',
                    }}
                />

                {/* Items Modal */}
                <PlaylistItemsModal
                    playlist={selectedPlaylist}
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    onRefresh={handleRefresh}
                />

                {/* Edit Modal */}
                <PlaylistEditModal
                    playlist={editingPlaylist}
                    open={isEditModalOpen}
                    onOpenChange={setIsEditModalOpen}
                    onSuccess={handleRefresh}
                />
            </main>
        </div>
    )
}
