'use client'

import { ArrowRightCircle, Clock } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import {
    ComingSoonEditModal,
    ComingSoonList,
    TransformDialog,
} from '@/components/coming-soon'
import { NavigationTabs } from '@/components/navigation-tabs'
import {
    ErrorDisplay,
    FilterBar,
    type SortOption,
    TabSwitcher,
} from '@/components/shared'
import { useComingSoon } from '@/hooks/use-coming-soon'
import { usePlatforms } from '@/hooks/use-platforms'
import { useTags } from '@/hooks/use-tags'

import type { ComingSoonFilters, ComingSoonWithTags } from '@/types/coming-soon'

type TabType = 'not-transformed' | 'transformed'

const SORT_OPTIONS: SortOption[] = [
    { value: 'custom', label: 'Custom Order' },
    { value: 'releaseDate-asc', label: 'Release Date (Soonest)' },
    { value: 'releaseDate-desc', label: 'Release Date (Latest)' },
    { value: 'createdAt-desc', label: 'Newest First' },
    { value: 'createdAt-asc', label: 'Oldest First' },
    { value: 'title-asc', label: 'Title A-Z' },
    { value: 'title-desc', label: 'Title Z-A' },
]

export default function ComingSoonPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialTab =
        searchParams.get('tab') === 'transformed'
            ? 'transformed'
            : 'not-transformed'

    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>(initialTab)

    // Filter state
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
    const [sortValue, setSortValue] = useState('custom')

    // Modal state
    const [editItem, setEditItem] = useState<ComingSoonWithTags | null>(null)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [transformItem, setTransformItem] =
        useState<ComingSoonWithTags | null>(null)
    const [transformDialogOpen, setTransformDialogOpen] = useState(false)

    // Platform and tag data
    const { platformOptions: platforms } = usePlatforms()
    const { tags: allTags } = useTags()

    // Parse sort value
    const isCustomOrder = sortValue === 'custom'
    const [sortBy, sortOrder] = isCustomOrder
        ? ([undefined, undefined] as const)
        : (sortValue.split('-') as [
              'createdAt' | 'updatedAt' | 'title' | 'releaseDate',
              'asc' | 'desc',
          ])

    // Build filters for not-transformed items
    const notTransformedFilters: ComingSoonFilters = useMemo(
        () => ({
            transformed: false,
            search: searchQuery || undefined,
            platforms:
                selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
            tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
            sortBy,
            sortOrder,
        }),
        [searchQuery, selectedPlatforms, selectedTagIds, sortBy, sortOrder],
    )

    // Build filters for transformed items
    const transformedFilters: ComingSoonFilters = useMemo(
        () => ({
            transformed: true,
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
    const notTransformedItems = useComingSoon({
        filters: notTransformedFilters,
    })
    const transformedItems = useComingSoon({ filters: transformedFilters })

    // Current hook based on active tab
    const currentHook =
        activeTab === 'not-transformed' ? notTransformedItems : transformedItems

    // Client-side tag filtering
    const filteredItems = useMemo(() => {
        if (selectedTagIds.length === 0) {
            return currentHook.items
        }
        return currentHook.items.filter((item) =>
            item.tags?.some((tag) => selectedTagIds.includes(tag.id)),
        )
    }, [currentHook.items, selectedTagIds])

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

    const handleTabChange = useCallback(
        (tab: string) => {
            setActiveTab(tab as TabType)
            const params = new URLSearchParams(searchParams.toString())
            if (tab === 'not-transformed') {
                params.delete('tab')
            } else {
                params.set('tab', tab)
            }
            const queryString = params.toString()
            router.push(`/coming-soon${queryString ? `?${queryString}` : ''}`, {
                scroll: false,
            })
        },
        [router, searchParams],
    )

    const handleEdit = (item: ComingSoonWithTags) => {
        setEditItem(item)
        setEditModalOpen(true)
    }

    const handleTransform = (item: ComingSoonWithTags) => {
        setTransformItem(item)
        setTransformDialogOpen(true)
    }

    const handleRefresh = useCallback(() => {
        notTransformedItems.refetch()
        transformedItems.refetch()
    }, [notTransformedItems, transformedItems])

    // Tab configuration
    const tabs = [
        {
            id: 'not-transformed',
            label: 'Not Transformed',
            icon: <Clock className='w-4 h-4' />,
            count: notTransformedItems.items.length,
        },
        {
            id: 'transformed',
            label: 'Transformed',
            icon: <ArrowRightCircle className='w-4 h-4' />,
            count: transformedItems.items.length,
        },
    ]

    return (
        <div className='min-h-screen bg-background text-foreground'>
            <NavigationTabs />

            <main className='container mx-auto px-4 pt-32 pb-12 max-w-6xl'>
                {/* Header */}
                <div className='mb-8'>
                    <div className='flex items-center gap-2 mb-2'>
                        <Clock className='w-8 h-8' />
                        <h1 className='text-2xl sm:text-3xl font-bold'>
                            Coming Soon
                        </h1>
                    </div>
                    <p className='text-gray-600 dark:text-gray-400'>
                        {notTransformedItems.items.length +
                            transformedItems.items.length}{' '}
                        items total
                        {(searchQuery ||
                            selectedPlatforms.length > 0 ||
                            selectedTagIds.length > 0) &&
                            ` - ${filteredItems.length} shown`}
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
                    searchPlaceholder='Search coming soon items...'
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

                {/* Coming Soon List */}
                <ComingSoonList
                    items={filteredItems}
                    loading={currentHook.loading}
                    onEdit={handleEdit}
                    onDelete={currentHook.deleteItem}
                    onTransform={handleTransform}
                    onReorder={
                        isCustomOrder
                            ? activeTab === 'not-transformed'
                                ? notTransformedItems.reorderItems
                                : transformedItems.reorderItems
                            : undefined
                    }
                    emptyState={{
                        title:
                            activeTab === 'not-transformed'
                                ? 'No items to transform'
                                : 'No transformed items',
                        description:
                            activeTab === 'not-transformed'
                                ? 'Add upcoming content to track release dates'
                                : 'Items will appear here once they have been transformed',
                    }}
                />

                {/* Modals */}
                <ComingSoonEditModal
                    item={editItem}
                    open={editModalOpen}
                    onOpenChange={setEditModalOpen}
                    onSuccess={handleRefresh}
                />
                <TransformDialog
                    item={transformItem}
                    open={transformDialogOpen}
                    onOpenChange={setTransformDialogOpen}
                />
            </main>
        </div>
    )
}
