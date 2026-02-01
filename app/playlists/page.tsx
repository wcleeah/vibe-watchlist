'use client'

import {
    CheckCircle2,
    Gamepad2,
    Globe,
    ListMusic,
    type LucideIcon,
    Tv,
    Youtube,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { NavigationTabs } from '@/components/navigation-tabs'
import { PlaylistItemsModal } from '@/components/playlists/playlist-items-modal'
import { PlaylistList } from '@/components/playlists/playlist-list'
import {
    ErrorDisplay,
    FilterBar,
    type PlatformOption,
    type SortOption,
    TabSwitcher,
    type TagOption,
} from '@/components/shared'
import { usePlaylists } from '@/hooks/use-playlists'
import type { PlaylistFilters, PlaylistSummary } from '@/types/playlist'

// Helper function to get icon component from string
const getIconComponent = (iconName: string): LucideIcon => {
    const iconMap: Record<string, LucideIcon> = {
        youtube: Youtube,
        tv: Tv,
        gamepad2: Gamepad2,
        globe: Globe,
        video: Globe,
    }
    return iconMap[iconName.toLowerCase()] || Globe
}

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
    const [sortValue, setSortValue] = useState('progress-asc')

    // Modal state
    const [selectedPlaylist, setSelectedPlaylist] =
        useState<PlaylistSummary | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Platform and tag data
    const [platforms, setPlatforms] = useState<PlatformOption[]>([])
    const [allTags, setAllTags] = useState<TagOption[]>([])

    // Load platforms
    useEffect(() => {
        const loadPlatforms = async () => {
            try {
                const response = await fetch('/api/platforms')
                if (response.ok) {
                    const data = await response.json()
                    const platformData: PlatformOption[] = data.data.map(
                        (p: {
                            platformId: string
                            displayName: string
                            icon?: string
                            color?: string
                        }) => ({
                            key: p.platformId,
                            label: p.displayName,
                            icon: getIconComponent(p.icon || 'Video'),
                            color: p.color || '#6b7280',
                        }),
                    )
                    setPlatforms(platformData)
                }
            } catch (error) {
                console.error('Failed to load platforms:', error)
            }
        }
        loadPlatforms()
    }, [])

    // Load tags
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await fetch('/api/tags')
                if (response.ok) {
                    const tags = await response.json()
                    setAllTags(tags)
                }
            } catch (error) {
                console.error('Failed to fetch tags:', error)
            }
        }
        fetchTags()
    }, [])

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
        }),
        [searchQuery, selectedPlatforms, selectedTagIds],
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
        }),
        [searchQuery, selectedPlatforms, selectedTagIds],
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
                    onSync={currentHook.sync}
                    onDelete={currentHook.deletePlaylist}
                    onReorder={
                        activeTab === 'active'
                            ? activePlaylists.reorderPlaylists
                            : completedPlaylists.reorderPlaylists
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
            </main>
        </div>
    )
}
