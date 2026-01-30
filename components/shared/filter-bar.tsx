'use client'

import type { LucideIcon } from 'lucide-react'
import { Filter, Search, Tag, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Types
export interface PlatformOption {
    key: string
    label: string
    icon: LucideIcon
    color: string
}

export interface TagOption {
    id: number
    name: string
    color?: string | null
}

export interface StatusOption {
    key: string
    label: string
    count?: number
    icon?: React.ReactNode
}

export interface SortOption {
    value: string
    label: string
}

export interface FilterChip {
    id: string
    label: string
    type: 'search' | 'platform' | 'tag' | 'status'
}

interface FilterBarProps {
    // Search
    searchQuery: string
    onSearchChange: (query: string) => void
    searchPlaceholder?: string

    // Platform filters
    platforms: PlatformOption[]
    selectedPlatforms: string[]
    onPlatformToggle: (platform: string) => void

    // Tag filters
    tags: TagOption[]
    selectedTagIds: number[]
    onTagToggle: (tagId: number) => void

    // Status filters (optional - for Series/Playlists)
    statusOptions?: StatusOption[]
    selectedStatus?: string
    onStatusChange?: (status: string) => void
    statusLabel?: string
    statusIcon?: React.ReactNode

    // Sort
    sortOptions: SortOption[]
    sortValue: string
    onSortChange: (value: string) => void

    // Clear all
    onClearAll?: () => void

    className?: string
}

export function FilterBar({
    searchQuery,
    onSearchChange,
    searchPlaceholder = 'Search...',
    platforms,
    selectedPlatforms,
    onPlatformToggle,
    tags,
    selectedTagIds,
    onTagToggle,
    statusOptions,
    selectedStatus,
    onStatusChange,
    statusLabel = 'Status',
    statusIcon,
    sortOptions,
    sortValue,
    onSortChange,
    onClearAll,
    className,
}: FilterBarProps) {
    const hasActiveFilters =
        searchQuery ||
        selectedPlatforms.length > 0 ||
        selectedTagIds.length > 0 ||
        (selectedStatus && selectedStatus !== 'all')

    return (
        <div className={cn('space-y-4', className)}>
            {/* Search and Sort Row */}
            <div className='flex flex-col sm:flex-row gap-2 sm:gap-4'>
                {/* Search Input */}
                <div className='relative flex-1'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className='pl-10'
                    />
                </div>

                {/* Sort Dropdown */}
                <div className='flex gap-2'>
                    <select
                        value={sortValue}
                        onChange={(e) => onSortChange(e.target.value)}
                        className='px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-md bg-white dark:bg-gray-900 text-sm'
                    >
                        {sortOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Status Filters (optional) */}
            {statusOptions && statusOptions.length > 0 && onStatusChange && (
                <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center'>
                    <div className='flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
                        {statusIcon}
                        {statusLabel}:
                    </div>
                    <div className='flex flex-wrap gap-2'>
                        {statusOptions.map((option) => (
                            <Button
                                key={option.key}
                                variant={
                                    selectedStatus === option.key
                                        ? 'default'
                                        : 'outline'
                                }
                                size='sm'
                                onClick={() => onStatusChange(option.key)}
                                className='h-8'
                            >
                                {option.icon}
                                {option.label}
                                {option.count !== undefined &&
                                    ` (${option.count})`}
                            </Button>
                        ))}
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
                        {platforms.map(({ key, label, icon: Icon }) => (
                            <Button
                                key={key}
                                variant={
                                    selectedPlatforms.includes(key)
                                        ? 'default'
                                        : 'outline'
                                }
                                size='sm'
                                onClick={() => onPlatformToggle(key)}
                                className={cn(
                                    'h-8',
                                    selectedPlatforms.includes(key)
                                        ? 'bg-gray-100 dark:bg-gray-800'
                                        : '',
                                )}
                            >
                                <Icon className='w-3 h-3 mr-1' />
                                {label}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Tag Filters */}
            {tags.length > 0 && (
                <div className='flex flex-wrap gap-2 items-center'>
                    <div className='flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
                        <Tag className='w-4 h-4' />
                        Tags:
                    </div>
                    {tags.map((tag) => (
                        <Badge
                            key={tag.id}
                            variant='outline'
                            className='cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1'
                            onClick={() => onTagToggle(tag.id)}
                            style={
                                selectedTagIds.includes(tag.id)
                                    ? {}
                                    : {
                                          borderColor: tag.color || '#6b7280',
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

            {/* Active Filters Summary */}
            {hasActiveFilters && (
                <div className='flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                    <span>Active filters:</span>
                    {searchQuery && (
                        <Badge
                            variant='secondary'
                            className='flex items-center gap-1'
                        >
                            Search: &quot;{searchQuery}&quot;
                            <button
                                type='button'
                                onClick={() => onSearchChange('')}
                                className='ml-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5'
                            >
                                <X className='w-3 h-3' />
                            </button>
                        </Badge>
                    )}
                    {selectedPlatforms.length > 0 && (
                        <Badge
                            variant='secondary'
                            className='flex items-center gap-1'
                        >
                            Platforms: {selectedPlatforms.join(', ')}
                            <button
                                type='button'
                                onClick={() => {
                                    for (const p of selectedPlatforms) {
                                        onPlatformToggle(p)
                                    }
                                }}
                                className='ml-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5'
                            >
                                <X className='w-3 h-3' />
                            </button>
                        </Badge>
                    )}
                    {selectedTagIds.length > 0 && (
                        <Badge
                            variant='secondary'
                            className='flex items-center gap-1'
                        >
                            {selectedTagIds.length} tag(s) selected
                            <button
                                type='button'
                                onClick={() => {
                                    for (const id of selectedTagIds) {
                                        onTagToggle(id)
                                    }
                                }}
                                className='ml-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5'
                            >
                                <X className='w-3 h-3' />
                            </button>
                        </Badge>
                    )}
                    {onClearAll && (
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={onClearAll}
                            className='h-6 px-2 text-xs'
                        >
                            Clear all
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
