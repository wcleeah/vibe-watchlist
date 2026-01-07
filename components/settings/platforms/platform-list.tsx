'use client'

import {
    Edit,
    Plus,
    RefreshCw,
    Settings,
    ToggleLeft,
    ToggleRight,
    Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PlatformConfig {
    id: string
    platformId: string
    name: string
    displayName: string
    patterns: string[]
    extractor: string
    color: string
    icon: string
    enabled: boolean
    isPreset: boolean
    confidenceScore: number
    createdAt: string
    updatedAt: string
}

interface PlatformListProps {
    onEdit: (platform: PlatformConfig) => void
    onAdd: () => void
    onRefresh: () => void
}

export function PlatformList({ onEdit, onAdd, onRefresh }: PlatformListProps) {
    const [platforms, setPlatforms] = useState<PlatformConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [toggling, setToggling] = useState<string | null>(null)

    const fetchPlatforms = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/platforms')
            if (response.ok) {
                const data = await response.json()
                // Include disabled platforms for management
                setPlatforms(data.data || [])
            }
        } catch (error) {
            console.error('Failed to fetch platforms:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPlatforms()
    }, [])

    const handleToggleEnabled = async (
        platformId: string,
        currentlyEnabled: boolean,
    ) => {
        try {
            setToggling(platformId)
            const response = await fetch(`/api/platforms/${platformId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !currentlyEnabled }),
            })

            if (response.ok) {
                setPlatforms(
                    platforms.map((p) =>
                        p.platformId === platformId
                            ? { ...p, enabled: !currentlyEnabled }
                            : p,
                    ),
                )
            }
        } catch (error) {
            console.error('Failed to toggle platform:', error)
        } finally {
            setToggling(null)
        }
    }

    const handleDelete = async (platformId: string, isPreset: boolean) => {
        if (isPreset) {
            alert(
                'Cannot delete preset platforms. You can disable them instead.',
            )
            return
        }

        if (
            !confirm(
                'Are you sure you want to delete this platform? This action cannot be undone.',
            )
        ) {
            return
        }

        try {
            const response = await fetch(`/api/platforms/${platformId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setPlatforms(
                    platforms.filter((p) => p.platformId !== platformId),
                )
            }
        } catch (error) {
            console.error('Failed to delete platform:', error)
        }
    }

    const getConfidenceColor = (score: number) => {
        if (score >= 0.8) return 'text-green-600 dark:text-green-400'
        if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
        return 'text-red-600 dark:text-red-400'
    }

    const getConfidenceLabel = (score: number) => {
        if (score >= 0.8) return 'High'
        if (score >= 0.6) return 'Medium'
        return 'Low'
    }

    if (loading) {
        return (
            <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden'>
                <div className='p-6 border-b border-gray-200 dark:border-gray-800'>
                    <div className='animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded w-48'></div>
                </div>
                <div className='divide-y divide-gray-200 dark:divide-gray-800'>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className='p-4'>
                            <div className='animate-pulse space-y-2'>
                                <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4'></div>
                                <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4'></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden'>
            <div className='p-6 border-b border-gray-200 dark:border-gray-800'>
                <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                        Platform Configurations ({platforms.length})
                    </h3>
                    <div className='flex gap-2'>
                        <Button onClick={onRefresh} variant='outline' size='sm'>
                            <RefreshCw className='w-4 h-4 mr-2' />
                            Refresh
                        </Button>
                        <Button onClick={onAdd} size='sm'>
                            <Plus className='w-4 h-4 mr-2' />
                            Add Platform
                        </Button>
                    </div>
                </div>
            </div>

            {platforms.length === 0 ? (
                <div className='p-8 text-center text-gray-500'>
                    <Settings className='w-12 h-12 mx-auto mb-4 text-gray-400' />
                    <p className='mb-4'>No platforms configured</p>
                    <Button onClick={onAdd}>
                        <Plus className='w-4 h-4 mr-2' />
                        Add Your First Platform
                    </Button>
                </div>
            ) : (
                <div className='divide-y divide-gray-200 dark:divide-gray-800'>
                    {platforms.map((platform) => (
                        <div
                            key={platform.platformId}
                            className='p-6 hover:bg-gray-50 dark:hover:bg-gray-900'
                        >
                            <div className='flex items-start justify-between'>
                                <div className='flex-1 min-w-0'>
                                    <div className='flex items-center gap-3 mb-2'>
                                        <h4 className='text-lg font-medium text-gray-900 dark:text-gray-100'>
                                            {platform.displayName}
                                        </h4>
                                        {platform.isPreset && (
                                            <Badge
                                                variant='secondary'
                                                className='text-xs'
                                            >
                                                Preset
                                            </Badge>
                                        )}
                                        <Badge
                                            variant={
                                                platform.enabled
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            className={
                                                platform.enabled
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                                                    : ''
                                            }
                                        >
                                            {platform.enabled
                                                ? 'Enabled'
                                                : 'Disabled'}
                                        </Badge>
                                    </div>

                                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3'>
                                        <div>
                                            <span className='text-sm text-gray-600 dark:text-gray-400'>
                                                Platform ID:
                                            </span>
                                            <code className='ml-2 text-sm font-mono text-gray-900 dark:text-gray-100'>
                                                {platform.platformId}
                                            </code>
                                        </div>
                                        <div>
                                            <span className='text-sm text-gray-600 dark:text-gray-400'>
                                                Extractor:
                                            </span>
                                            <span className='ml-2 text-sm text-gray-900 dark:text-gray-100'>
                                                {platform.extractor}
                                            </span>
                                        </div>
                                        <div>
                                            <span className='text-sm text-gray-600 dark:text-gray-400'>
                                                Confidence:
                                            </span>
                                            <span
                                                className={`ml-2 text-sm font-medium ${getConfidenceColor(platform.confidenceScore)}`}
                                            >
                                                {getConfidenceLabel(
                                                    platform.confidenceScore,
                                                )}{' '}
                                                (
                                                {Math.round(
                                                    platform.confidenceScore *
                                                        100,
                                                )}
                                                %)
                                            </span>
                                        </div>
                                    </div>

                                    <div className='mb-3'>
                                        <span className='text-sm text-gray-600 dark:text-gray-400'>
                                            Patterns:
                                        </span>
                                        <div className='flex flex-wrap gap-1 mt-1'>
                                            {platform.patterns.map(
                                                (pattern, index) => (
                                                    <code
                                                        key={index}
                                                        className='text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono'
                                                    >
                                                        {pattern}
                                                    </code>
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    <div className='flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400'>
                                        <span>
                                            Created:{' '}
                                            {new Date(
                                                platform.createdAt,
                                            ).toLocaleDateString()}
                                        </span>
                                        <span>
                                            Updated:{' '}
                                            {new Date(
                                                platform.updatedAt,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className='flex items-center gap-2 ml-4'>
                                    <Button
                                        onClick={() =>
                                            handleToggleEnabled(
                                                platform.platformId,
                                                platform.enabled,
                                            )
                                        }
                                        disabled={
                                            toggling === platform.platformId
                                        }
                                        variant='outline'
                                        size='sm'
                                        className='h-8'
                                    >
                                        {platform.enabled ? (
                                            <ToggleRight className='w-4 h-4 text-green-600' />
                                        ) : (
                                            <ToggleLeft className='w-4 h-4 text-gray-400' />
                                        )}
                                    </Button>

                                    <Button
                                        onClick={() => onEdit(platform)}
                                        variant='outline'
                                        size='sm'
                                        className='h-8'
                                    >
                                        <Edit className='w-4 h-4' />
                                    </Button>

                                    <Button
                                        onClick={() =>
                                            handleDelete(
                                                platform.platformId,
                                                platform.isPreset,
                                            )
                                        }
                                        variant='outline'
                                        size='sm'
                                        className='h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950'
                                        disabled={platform.isPreset}
                                    >
                                        <Trash2 className='w-4 h-4' />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
