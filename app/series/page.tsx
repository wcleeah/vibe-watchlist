'use client'

import {
    Archive,
    CalendarDays,
    CheckCircle2,
    Filter,
    Gamepad2,
    Globe,
    type LucideIcon,
    Search,
    Tag,
    Tv,
    X,
    Youtube,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { NavigationTabs } from '@/components/navigation-tabs'
import { SeriesEditModal } from '@/components/series/series-edit-modal'
import { SeriesList } from '@/components/series/series-list'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSeries } from '@/hooks/use-series'
import type { SeriesFilters, SeriesWithTags } from '@/types/series'
import { isBacklogSeries } from '@/types/series'

// Helper function to get icon component from string
const getIconComponent = (iconName: string) => {
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
type StatusFilter = 'all' | 'behind' | 'caught-up' | 'backlog'

export default function SeriesPage() {
    const [activeTab, setActiveTab] = useState<TabType>('active')
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
    const [allTags, setAllTags] = useState<
        { id: number; name: string; color?: string }[]
    >([])

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
        }),
        [statusFilter, selectedPlatforms, searchQuery],
    )

    // Build filters for watched series
    const watchedFilters: SeriesFilters = useMemo(
        () => ({
            search: searchQuery || undefined,
            isWatched: true,
        }),
        [searchQuery],
    )

    // Two separate hooks for active and watched series
    const activeSeries = useSeries({ filters: activeFilters })
    const watchedSeries = useSeries({ filters: watchedFilters })

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

    // Get current data based on active tab
    const currentHook = activeTab === 'active' ? activeSeries : watchedSeries
    const { series: currentSeries, loading, error, refetch } = currentHook

    // Client-side filtering for multiple platforms, tags, and backlog status
    const filteredSeries = useMemo(() => {
        return currentSeries.filter((s: SeriesWithTags) => {
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
    }, [currentSeries, selectedPlatforms, selectedTagIds, statusFilter])

    const handlePlatformFilter = (platform: string) => {
        setSelectedPlatforms((prev) =>
            prev.includes(platform)
                ? prev.filter((p) => p !== platform)
                : [...prev, platform],
        )
    }

    const handleTagFilter = (tagId: number) => {
        setSelectedTagIds((prev) =>
            prev.includes(tagId)
                ? prev.filter((id) => id !== tagId)
                : [...prev, tagId],
        )
    }

    const [platforms, setPlatforms] = useState<
        Array<{
            key: string
            label: string
            icon: LucideIcon
            color: string
        }>
    >([])

    // Edit modal state
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editingSeries, setEditingSeries] = useState<SeriesWithTags | null>(
        null,
    )

    const handleEditSeries = (series: SeriesWithTags) => {
        setEditingSeries(series)
        setEditModalOpen(true)
    }

    const handleEditSuccess = () => {
        activeSeries.refetch()
        watchedSeries.refetch()
    }

    // Load platforms dynamically
    useEffect(() => {
        const loadPlatforms = async () => {
            try {
                const response = await fetch('/api/platforms')
                if (response.ok) {
                    const data = await response.json()
                    const platformData = data.data.map((p: any) => ({
                        key: p.platformId,
                        label: p.displayName,
                        icon: getIconComponent(p.icon || 'Video'),
                        color: p.color || '#6b7280',
                    }))
                    setPlatforms(platformData)
                }
            } catch (error) {
                console.error('Failed to load platforms:', error)
                setPlatforms([])
            }
        }
        loadPlatforms()
    }, [])

    // Count series by status (for active series only)
    const statusCounts = useMemo(() => {
        const counts = {
            all: activeSeries.series.length,
            behind: 0,
            'caught-up': 0,
            backlog: 0,
        }
        activeSeries.series.forEach((s: SeriesWithTags) => {
            if (!s.isActive) return
            if (isBacklogSeries(s)) {
                counts.backlog++
            } else if (s.missedPeriods > 0) {
                counts.behind++
            } else {
                counts['caught-up']++
            }
        })
        return counts
    }, [activeSeries.series])

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
                {error && (
                    <div className='mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
                        <p className='text-red-600 dark:text-red-400'>
                            {error}
                        </p>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={refetch}
                            className='mt-2'
                        >
                            Retry
                        </Button>
                    </div>
                )}

                {/* Search and Filters */}
                <div className='mb-8 space-y-4'>
                    {/* Search */}
                    <div className='relative'>
                        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                        <Input
                            type='text'
                            placeholder='Search series...'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className='pl-10'
                        />
                    </div>

                    {/* Status Filter - only show on Active tab */}
                    {activeTab === 'active' && (
                        <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center'>
                            <div className='flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
                                <CalendarDays className='w-4 h-4' />
                                Status:
                            </div>
                            <div className='flex flex-wrap gap-2'>
                                <Button
                                    variant={
                                        statusFilter === 'all'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size='sm'
                                    onClick={() => setStatusFilter('all')}
                                    className='h-8'
                                >
                                    All ({statusCounts.all})
                                </Button>
                                <Button
                                    variant={
                                        statusFilter === 'behind'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size='sm'
                                    onClick={() => setStatusFilter('behind')}
                                    className='h-8'
                                >
                                    Behind ({statusCounts.behind})
                                </Button>
                                <Button
                                    variant={
                                        statusFilter === 'caught-up'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size='sm'
                                    onClick={() => setStatusFilter('caught-up')}
                                    className='h-8'
                                >
                                    Caught Up ({statusCounts['caught-up']})
                                </Button>
                                <Button
                                    variant={
                                        statusFilter === 'backlog'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size='sm'
                                    onClick={() => setStatusFilter('backlog')}
                                    className='h-8'
                                >
                                    <Archive className='w-3 h-3 mr-1' />
                                    Backlog ({statusCounts.backlog})
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Platform Filters */}
                    {platforms.length > 0 && (
                        <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center'>
                            <div className='flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
                                <Filter className='w-4 h-4' />
                                Platforms:
                            </div>
                            <div className='flex flex-wrap gap-2'>
                                {platforms.map(
                                    ({ key, label, icon: Icon, color }) => (
                                        <Button
                                            key={key}
                                            variant={
                                                selectedPlatforms.includes(key)
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size='sm'
                                            onClick={() =>
                                                handlePlatformFilter(key)
                                            }
                                            className={`h-8 ${selectedPlatforms.includes(key) ? 'bg-gray-100 dark:bg-gray-800' : color}`}
                                        >
                                            <Icon className='w-3 h-3 mr-1' />
                                            {label}
                                        </Button>
                                    ),
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tag Filters */}
                    {allTags.length > 0 && (
                        <div className='flex flex-wrap gap-2 items-center'>
                            <div className='flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
                                <Tag className='w-4 h-4' />
                                Tags:
                            </div>
                            {allTags.map((tag) => (
                                <Badge
                                    key={tag.id}
                                    variant='outline'
                                    className='cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1'
                                    onClick={() => handleTagFilter(tag.id)}
                                    style={
                                        selectedTagIds.includes(tag.id)
                                            ? {}
                                            : {
                                                  borderColor:
                                                      tag.color || '#6b7280',
                                                  color: tag.color || '#6b7280',
                                              }
                                    }
                                >
                                    {selectedTagIds.includes(tag.id) && (
                                        <X className='w-3 h-3' />
                                    )}
                                    #{tag.name}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Active/Watched Tabs */}
                <div className='mb-6 flex gap-2'>
                    <Button
                        variant={activeTab === 'active' ? 'default' : 'outline'}
                        size='sm'
                        onClick={() => setActiveTab('active')}
                        className='h-9'
                    >
                        <CalendarDays className='w-4 h-4 mr-2' />
                        Active ({activeSeries.series.length})
                    </Button>
                    <Button
                        variant={
                            activeTab === 'watched' ? 'default' : 'outline'
                        }
                        size='sm'
                        onClick={() => setActiveTab('watched')}
                        className='h-9'
                    >
                        <CheckCircle2 className='w-4 h-4 mr-2' />
                        Watched ({watchedSeries.series.length})
                    </Button>
                </div>

                {/* Series List */}
                <SeriesList
                    series={filteredSeries}
                    loading={loading}
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
                />

                {/* Edit Modal */}
                <SeriesEditModal
                    series={editingSeries}
                    open={editModalOpen}
                    onOpenChange={setEditModalOpen}
                    onSuccess={handleEditSuccess}
                />
            </main>
        </div>
    )
}
