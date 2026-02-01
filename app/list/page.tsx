'use client'

import {
    CheckCircle2,
    Gamepad2,
    Globe,
    ListVideo,
    type LucideIcon,
    Tv,
    Youtube,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { NavigationTabs } from '@/components/navigation-tabs'
import {
    ErrorDisplay,
    FilterBar,
    type PlatformOption,
    type SortOption,
    TabSwitcher,
    type TagOption,
} from '@/components/shared'
import { VideoEditModal } from '@/components/video-form/video-edit-modal'
import { ConvertToPlaylistModal } from '@/components/videos/convert-to-playlist-modal'
import { ConvertToSeriesModal } from '@/components/videos/convert-to-series-modal'
import { VideoList } from '@/components/videos/video-list'
import { useVideos } from '@/hooks/use-videos'
import type { VideoFilters, VideoWithTags } from '@/types/video'

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

type TabType = 'active' | 'watched'

const SORT_OPTIONS: SortOption[] = [
    { value: 'createdAt-desc', label: 'Newest First' },
    { value: 'createdAt-asc', label: 'Oldest First' },
    { value: 'updatedAt-desc', label: 'Recently Updated' },
    { value: 'title-asc', label: 'Title A-Z' },
    { value: 'title-desc', label: 'Title Z-A' },
]

export default function ListPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialTab =
        searchParams.get('tab') === 'watched' ? 'watched' : 'active'

    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>(initialTab)

    // Filter state
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
    const [sortValue, setSortValue] = useState('createdAt-desc')

    // Modal state
    const [editVideo, setEditVideo] = useState<VideoWithTags | null>(null)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [convertVideo, setConvertVideo] = useState<VideoWithTags | null>(null)
    const [convertModalOpen, setConvertModalOpen] = useState(false)
    const [convertPlaylistVideo, setConvertPlaylistVideo] =
        useState<VideoWithTags | null>(null)
    const [convertPlaylistModalOpen, setConvertPlaylistModalOpen] =
        useState(false)

    // Platform and tag data
    const [platforms, setPlatforms] = useState<PlatformOption[]>([])
    const [allTags, setAllTags] = useState<TagOption[]>([])

    // Parse sort value
    const [sortBy, sortOrder] = sortValue.split('-') as [
        'createdAt' | 'updatedAt' | 'title',
        'asc' | 'desc',
    ]

    // Build filters for active videos
    const activeFilters: VideoFilters = useMemo(
        () => ({
            isWatched: false,
            search: searchQuery || undefined,
            platforms:
                selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
            tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
            sortBy,
            sortOrder,
        }),
        [searchQuery, selectedPlatforms, selectedTagIds, sortBy, sortOrder],
    )

    // Build filters for watched videos
    const watchedFilters: VideoFilters = useMemo(
        () => ({
            isWatched: true,
            search: searchQuery || undefined,
            platforms:
                selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
            tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
            sortBy,
            sortOrder,
        }),
        [searchQuery, selectedPlatforms, selectedTagIds, sortBy, sortOrder],
    )

    // Data hooks for both tabs
    const activeVideos = useVideos({ filters: activeFilters })
    const watchedVideos = useVideos({ filters: watchedFilters })

    // Current hook based on active tab
    const currentHook = activeTab === 'active' ? activeVideos : watchedVideos

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

    // Client-side tag filtering
    const filteredVideos = useMemo(() => {
        if (selectedTagIds.length === 0) {
            return currentHook.videos
        }
        return currentHook.videos.filter((video) =>
            video.tags?.some((tag) => selectedTagIds.includes(tag.id)),
        )
    }, [currentHook.videos, selectedTagIds])

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
            router.push(`/list${queryString ? `?${queryString}` : ''}`, {
                scroll: false,
            })
        },
        [router, searchParams],
    )

    const handleEdit = (video: VideoWithTags) => {
        setEditVideo(video)
        setEditModalOpen(true)
    }

    const handleConvertToSeries = (video: VideoWithTags) => {
        setConvertVideo(video)
        setConvertModalOpen(true)
    }

    const handleConvertToPlaylist = (video: VideoWithTags) => {
        setConvertPlaylistVideo(video)
        setConvertPlaylistModalOpen(true)
    }

    const handleRefresh = useCallback(() => {
        activeVideos.refetch()
        watchedVideos.refetch()
    }, [activeVideos, watchedVideos])

    // Compute which videos have YouTube playlist URLs
    const playlistUrlVideoIds = useMemo(() => {
        const ids = new Set<number>()
        for (const video of currentHook.videos) {
            try {
                const url = new URL(video.url)
                const hasPlaylistId = url.searchParams.has('list')
                const isPlaylistPage = url.pathname.includes('/playlist')
                if (
                    video.platform === 'youtube' &&
                    (hasPlaylistId || isPlaylistPage)
                ) {
                    ids.add(video.id)
                }
            } catch {
                // Invalid URL, skip
            }
        }
        return ids
    }, [currentHook.videos])

    // Tab configuration
    const tabs = [
        {
            id: 'active',
            label: 'Active',
            icon: <ListVideo className='w-4 h-4' />,
            count: activeVideos.videos.length,
        },
        {
            id: 'watched',
            label: 'Watched',
            icon: <CheckCircle2 className='w-4 h-4' />,
            count: watchedVideos.videos.length,
        },
    ]

    return (
        <div className='min-h-screen bg-background text-foreground'>
            <NavigationTabs />

            <main className='container mx-auto px-4 pt-32 pb-12 max-w-6xl'>
                {/* Header */}
                <div className='mb-8'>
                    <div className='flex items-center gap-2 mb-2'>
                        <ListVideo className='w-8 h-8' />
                        <h1 className='text-2xl sm:text-3xl font-bold'>
                            My Watchlist
                        </h1>
                    </div>
                    <p className='text-gray-600 dark:text-gray-400'>
                        {activeVideos.videos.length +
                            watchedVideos.videos.length}{' '}
                        videos total
                        {(searchQuery ||
                            selectedPlatforms.length > 0 ||
                            selectedTagIds.length > 0) &&
                            ` - ${filteredVideos.length} shown`}
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
                    searchPlaceholder='Search videos...'
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

                {/* Video List */}
                <VideoList
                    videos={filteredVideos}
                    loading={currentHook.loading}
                    onMarkWatched={
                        activeTab === 'active'
                            ? activeVideos.markWatched
                            : watchedVideos.markUnwatched
                    }
                    onDelete={currentHook.deleteVideo}
                    onEdit={handleEdit}
                    onConvertToSeries={handleConvertToSeries}
                    onConvertToPlaylist={handleConvertToPlaylist}
                    playlistUrlVideoIds={playlistUrlVideoIds}
                    onReorder={
                        activeTab === 'active'
                            ? activeVideos.reorderVideos
                            : watchedVideos.reorderVideos
                    }
                    emptyState={{
                        title:
                            activeTab === 'active'
                                ? 'No active videos'
                                : 'No watched videos',
                        description:
                            activeTab === 'active'
                                ? 'Add videos from the home page to get started'
                                : 'Mark videos as watched to see them here',
                    }}
                />

                {/* Modals */}
                <VideoEditModal
                    video={editVideo}
                    open={editModalOpen}
                    onOpenChange={setEditModalOpen}
                    onSuccess={handleRefresh}
                />
                <ConvertToSeriesModal
                    video={convertVideo}
                    open={convertModalOpen}
                    onOpenChange={setConvertModalOpen}
                    onSuccess={handleRefresh}
                />
                <ConvertToPlaylistModal
                    video={convertPlaylistVideo}
                    open={convertPlaylistModalOpen}
                    onOpenChange={setConvertPlaylistModalOpen}
                    onSuccess={handleRefresh}
                />
            </main>
        </div>
    )
}
