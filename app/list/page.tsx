'use client'

import { CheckCircle2, ListVideo } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { NavigationTabs } from '@/components/navigation-tabs'
import {
    ErrorDisplay,
    FilterBar,
    type SortOption,
    TabSwitcher,
} from '@/components/shared'
import { VideoEditModal } from '@/components/video-form/video-edit-modal'
import { ConvertToPlaylistModal } from '@/components/videos/convert-to-playlist-modal'
import { ConvertToSeriesModal } from '@/components/videos/convert-to-series-modal'
import { VideoList } from '@/components/videos/video-list'
import { usePlatforms } from '@/hooks/use-platforms'
import { useTags } from '@/hooks/use-tags'
import { useVideos } from '@/hooks/use-videos'
import type { VideoFilters, VideoWithTags } from '@/types/video'

type TabType = 'active' | 'watched'

const SORT_OPTIONS: SortOption[] = [
    { value: 'custom', label: 'Custom Order' },
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
    const [sortValue, setSortValue] = useState('custom')

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
    const { platformOptions: platforms } = usePlatforms()
    const { tags: allTags } = useTags()

    // Parse sort value (custom order uses sortOrder from DB)
    const isCustomOrder = sortValue === 'custom'
    const [sortBy, sortOrder] = isCustomOrder
        ? ([undefined, undefined] as const)
        : (sortValue.split('-') as [
              'createdAt' | 'updatedAt' | 'title',
              'asc' | 'desc',
          ])

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
                        isCustomOrder
                            ? activeTab === 'active'
                                ? activeVideos.reorderVideos
                                : watchedVideos.reorderVideos
                            : undefined
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
