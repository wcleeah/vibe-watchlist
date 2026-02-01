'use client'

import { Archive, CalendarDays, CheckCircle2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { NavigationTabs } from '@/components/navigation-tabs'
import { SeriesEditModal } from '@/components/series/series-edit-modal'
import { SeriesList } from '@/components/series/series-list'
import {
    ErrorDisplay,
    FilterBar,
    type PlatformOption,
    type SortOption,
    type StatusOption,
    TabSwitcher,
    type TagOption,
} from '@/components/shared'
import { useSeries } from '@/hooks/use-series'
import { getIconComponent } from '@/lib/utils/icon-utils'
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
    const [platforms, setPlatforms] = useState<PlatformOption[]>([])
    const [allTags, setAllTags] = useState<TagOption[]>([])

    // Edit modal state
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editingSeries, setEditingSeries] = useState<SeriesWithTags | null>(
        null,
    )

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

    // Fetch available tags
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

    // Load platforms dynamically
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

    const handleRefresh = useCallback(() => {
        activeSeries.refetch()
        watchedSeries.refetch()
    }, [activeSeries, watchedSeries])

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
                    <p className='text-gray-600 dark:text-gray-400'>
                        {activeSeries.series.length +
                            watchedSeries.series.length}{' '}
                        series tracked
                        {statusCounts.behind > 0 &&
                            ` - ${statusCounts.behind} behind`}
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
            </main>
        </div>
    )
}
