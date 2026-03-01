'use client'

import { Archive, CalendarDays, CheckCircle2, RefreshCw } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { NavigationTabs } from '@/components/navigation-tabs'
import { SeriesEditModal } from '@/components/series/series-edit-modal'
import { SeriesList } from '@/components/series/series-list'
import {
    ErrorDisplay,
    FilterBar,
    type SortOption,
    type StatusOption,
    TabSwitcher,
} from '@/components/shared'
import { Button } from '@/components/ui/button'
import {
    type RefreshableMediaItem,
    RefreshMetadataModal,
} from '@/components/video-form/refresh-metadata-modal'
import { usePlatforms } from '@/hooks/use-platforms'
import { useSeries } from '@/hooks/use-series'
import { useTags } from '@/hooks/use-tags'
import type { SeriesFilters, SeriesWithTags } from '@/types/series'
import { isBacklogSeries } from '@/types/series'

type TabType = 'active' | 'watched'
type StatusFilter = 'all' | 'behind' | 'caught-up' | 'backlog'

const SORT_OPTIONS: SortOption[] = [
    { value: 'custom', label: 'Custom Order' },
    { value: 'missedPeriods-desc', label: 'Most Behind' },
    { value: 'missedPeriods-asc', label: 'Least Behind' },
    { value: 'createdAt-desc', label: 'Newest First' },
    { value: 'createdAt-asc', label: 'Oldest First' },
    { value: 'title-asc', label: 'Title A-Z' },
    { value: 'title-desc', label: 'Title Z-A' },
]

export default function SeriesPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialTab =
        searchParams.get('tab') === 'watched' ? 'watched' : 'active'

    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>(initialTab)

    // Filter state
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
    const [sortValue, setSortValue] = useState('custom')

    // Check if custom order is selected (for drag-drop)
    const isCustomOrder = sortValue === 'custom'

    // Parse sort value for API
    const [sortBy, sortOrder] = isCustomOrder
        ? (['custom', 'desc'] as const)
        : (sortValue.split('-') as [
              'missedPeriods' | 'createdAt' | 'title',
              'asc' | 'desc',
          ])

    // Platform and tag data
    const { platformOptions: platforms } = usePlatforms()
    const { tags: allTags } = useTags()

    // Edit modal state
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editingSeries, setEditingSeries] = useState<SeriesWithTags | null>(
        null,
    )

    // Refresh metadata modal state
    const [refreshMetadataItem, setRefreshMetadataItem] =
        useState<RefreshableMediaItem | null>(null)
    const [refreshMetadataOpen, setRefreshMetadataOpen] = useState(false)
    const [refreshMetadataSeriesId, setRefreshMetadataSeriesId] = useState<
        number | null
    >(null)

    // Trigger update loading state
    const [isTriggeringUpdate, setIsTriggeringUpdate] = useState(false)

    // Build filters for active series (not watched)
    const activeFilters: SeriesFilters = useMemo(
        () => ({
            status:
                statusFilter === 'all' || statusFilter === 'backlog'
                    ? undefined
                    : statusFilter,
            platform:
                selectedPlatforms.length === 1
                    ? selectedPlatforms[0]
                    : undefined,
            search: searchQuery || undefined,
            isWatched: false,
            sortBy,
            sortOrder,
        }),
        [statusFilter, selectedPlatforms, searchQuery, sortBy, sortOrder],
    )

    // Build filters for watched series
    const watchedFilters: SeriesFilters = useMemo(
        () => ({
            search: searchQuery || undefined,
            isWatched: true,
            sortBy,
            sortOrder,
        }),
        [searchQuery, sortBy, sortOrder],
    )

    // Two separate hooks for active and watched series
    const activeSeries = useSeries({ filters: activeFilters })
    const watchedSeries = useSeries({ filters: watchedFilters })

    // Get current data based on active tab
    const currentHook = activeTab === 'active' ? activeSeries : watchedSeries

    // Client-side filtering for multiple platforms, tags, and backlog status
    const filteredSeries = useMemo(() => {
        return currentHook.series.filter((s: SeriesWithTags) => {
            // Filter by multiple platforms if more than one selected
            const matchesPlatform =
                selectedPlatforms.length <= 1 ||
                selectedPlatforms.includes(s.platform)

            // Filter by tags
            const matchesTags =
                selectedTagIds.length === 0 ||
                s.tags?.some((tag: { id: number }) =>
                    selectedTagIds.includes(tag.id),
                )

            // Filter by backlog status (only on active tab)
            const matchesBacklog =
                statusFilter !== 'backlog' || isBacklogSeries(s)

            return matchesPlatform && matchesTags && matchesBacklog
        })
    }, [currentHook.series, selectedPlatforms, selectedTagIds, statusFilter])

    // Count series by status (for active series only)
    const statusCounts = useMemo(() => {
        const counts = {
            all: activeSeries.series.length,
            behind: 0,
            'caught-up': 0,
            backlog: 0,
        }
        for (const s of activeSeries.series) {
            if (!s.isActive) continue
            if (isBacklogSeries(s)) {
                counts.backlog++
            } else if (s.missedPeriods > 0) {
                counts.behind++
            } else {
                counts['caught-up']++
            }
        }
        return counts
    }, [activeSeries.series])

    // Build status options for FilterBar (only shown on active tab)
    const statusOptions: StatusOption[] = useMemo(
        () => [
            { key: 'all', label: 'All', count: statusCounts.all },
            { key: 'behind', label: 'Behind', count: statusCounts.behind },
            {
                key: 'caught-up',
                label: 'Caught Up',
                count: statusCounts['caught-up'],
            },
            {
                key: 'backlog',
                label: 'Backlog',
                count: statusCounts.backlog,
                icon: <Archive className='w-3 h-3 mr-1' />,
            },
        ],
        [statusCounts],
    )

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
        setStatusFilter('all')
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
            router.push(`/series${queryString ? `?${queryString}` : ''}`, {
                scroll: false,
            })
        },
        [router, searchParams],
    )

    const handleEditSeries = (series: SeriesWithTags) => {
        setEditingSeries(series)
        setEditModalOpen(true)
    }

    const handleRefreshMetadata = (series: SeriesWithTags) => {
        setRefreshMetadataItem({
            url: series.url,
            title: series.title,
            thumbnailUrl: series.thumbnailUrl,
        })
        setRefreshMetadataSeriesId(series.id)
        setRefreshMetadataOpen(true)
    }

    const handleRefresh = useCallback(async () => {
        try {
            await Promise.all([activeSeries.refetch(), watchedSeries.refetch()])
            toast.success('Series refreshed')
        } catch {
            toast.error('Failed to refresh series')
        }
    }, [activeSeries, watchedSeries])

    const handleMetadataUpdate = useCallback(
        async (title: string, thumbnailUrl: string | null) => {
            if (!refreshMetadataSeriesId) return
            const response = await fetch(
                `/api/series/${refreshMetadataSeriesId}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, thumbnailUrl }),
                },
            )
            if (!response.ok) {
                throw new Error('Failed to update series metadata')
            }
            toast.success('Series metadata updated')
            await handleRefresh()
        },
        [refreshMetadataSeriesId, handleRefresh],
    )

    // Handle manual series update trigger
    const handleTriggerUpdate = useCallback(async () => {
        setIsTriggeringUpdate(true)
        try {
            await activeSeries.triggerUpdate()
            toast.success('Series update completed')
            // Refetch to show updated data
            await handleRefresh()
        } catch {
            toast.error('Failed to run series update')
        } finally {
            setIsTriggeringUpdate(false)
        }
    }, [activeSeries, handleRefresh])

    // Tab configuration
    const tabs = [
        {
            id: 'active',
            label: 'Active',
            icon: <CalendarDays className='w-4 h-4' />,
            count: activeSeries.series.length,
        },
        {
            id: 'watched',
            label: 'Watched',
            icon: <CheckCircle2 className='w-4 h-4' />,
            count: watchedSeries.series.length,
        },
    ]

    return (
        <div className='min-h-screen bg-background text-foreground'>
            <NavigationTabs />

            <main className='container mx-auto px-4 pt-32 pb-12 max-w-6xl'>
                {/* Header */}
                <div className='mb-8'>
                    <div className='flex items-center gap-2 mb-2'>
                        <CalendarDays className='w-8 h-8' />
                        <h1 className='text-2xl sm:text-3xl font-bold'>
                            Series
                        </h1>
                    </div>
                    <div className='flex items-center justify-between'>
                        <p className='text-gray-600 dark:text-gray-400'>
                            {activeSeries.series.length +
                                watchedSeries.series.length}{' '}
                            series tracked
                            {statusCounts.behind > 0 &&
                                ` - ${statusCounts.behind} behind`}
                        </p>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={handleTriggerUpdate}
                            disabled={isTriggeringUpdate}
                            className='gap-2'
                        >
                            <RefreshCw
                                className={`w-4 h-4 ${
                                    isTriggeringUpdate ? 'animate-spin' : ''
                                }`}
                            />
                            {isTriggeringUpdate ? 'Updating...' : 'Run Update'}
                        </Button>
                    </div>
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
                    searchPlaceholder='Search series...'
                    platforms={platforms}
                    selectedPlatforms={selectedPlatforms}
                    onPlatformToggle={handlePlatformToggle}
                    tags={allTags}
                    selectedTagIds={selectedTagIds}
                    onTagToggle={handleTagToggle}
                    statusOptions={activeTab === 'active' ? statusOptions : []}
                    selectedStatus={statusFilter}
                    onStatusChange={(status) =>
                        setStatusFilter(status as StatusFilter)
                    }
                    statusLabel='Status'
                    statusIcon={<CalendarDays className='w-4 h-4' />}
                    sortOptions={SORT_OPTIONS}
                    sortValue={sortValue}
                    onSortChange={setSortValue}
                    onClearAll={handleClearAll}
                    className='mb-6'
                />

                {/* Series List */}
                <SeriesList
                    series={filteredSeries}
                    loading={currentHook.loading}
                    onCatchUp={activeSeries.catchUp}
                    onMarkWatched={activeSeries.markWatched}
                    onUnmarkWatched={watchedSeries.unmarkWatched}
                    onIncrementProgress={activeSeries.incrementProgress}
                    onDelete={
                        activeTab === 'active'
                            ? activeSeries.deleteSeries
                            : watchedSeries.deleteSeries
                    }
                    onEdit={handleEditSeries}
                    onRefreshMetadata={handleRefreshMetadata}
                    onReorder={
                        isCustomOrder
                            ? activeTab === 'active'
                                ? activeSeries.reorderSeries
                                : watchedSeries.reorderSeries
                            : undefined
                    }
                />

                {/* Edit Modal */}
                <SeriesEditModal
                    series={editingSeries}
                    open={editModalOpen}
                    onOpenChange={setEditModalOpen}
                    onSuccess={handleRefresh}
                />

                {/* Refresh Metadata Modal */}
                <RefreshMetadataModal
                    item={refreshMetadataItem}
                    open={refreshMetadataOpen}
                    onOpenChange={setRefreshMetadataOpen}
                    onUpdate={handleMetadataUpdate}
                />
            </main>
        </div>
    )
}
