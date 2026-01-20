'use client'

import {
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
import { toast } from 'sonner'
import { NavigationTabs } from '@/components/navigation-tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { VideoEditModal } from '@/components/video-form/video-edit-modal'
import { VideoList } from '@/components/videos/video-list'
import type { VideoWithTags as Video } from '@/types/video'

// Helper function to get icon component from string
const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, LucideIcon> = {
        youtube: Youtube,
        tv: Tv,
        gamepad2: Gamepad2,
        globe: Globe,
        video: Globe, // fallback
    }
    return iconMap[iconName.toLowerCase()] || Globe
}

export default function WatchedPage() {
    const [videos, setVideos] = useState<Video[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
    const [allTags, setAllTags] = useState<
        { id: number; name: string; color?: string }[]
    >([])

    // Edit modal state
    const [editVideo, setEditVideo] = useState<Video | null>(null)
    const [editModalOpen, setEditModalOpen] = useState(false)

    // Always show watched videos
    const watched = 'true'

    // Fetch videos on mount and when filters change
    useEffect(() => {
        const fetchVideos = async () => {
            setLoading(true)
            try {
                const params = new URLSearchParams()
                params.set('watched', watched)
                if (searchQuery) params.set('search', searchQuery)
                selectedPlatforms.forEach((platform) =>
                    params.set('platforms', platform),
                )
                selectedTagIds.forEach((tagId) =>
                    params.set('tags', tagId.toString()),
                )

                const response = await fetch(`/api/videos?${params}`)
                if (response.ok) {
                    const data = await response.json()
                    setVideos(data)
                }
            } catch (error) {
                console.error('Error fetching videos:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchVideos()
    }, [searchQuery, selectedPlatforms, selectedTagIds])

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

    // Filter videos based on current filters
    const filteredVideos = useMemo(() => {
        return videos.filter((video) => {
            const matchesSearch =
                !searchQuery ||
                video.title
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                video.tags?.some((tag) =>
                    tag.name.toLowerCase().includes(searchQuery.toLowerCase()),
                )

            const matchesPlatform =
                selectedPlatforms.length === 0 ||
                selectedPlatforms.includes(video.platform)

            const matchesTags =
                selectedTagIds.length === 0 ||
                video.tags?.some((tag) => selectedTagIds.includes(tag.id))

            return matchesSearch && matchesPlatform && matchesTags
        })
    }, [videos, searchQuery, selectedPlatforms, selectedTagIds])

    const handleMarkWatched = async (id: number) => {
        try {
            const response = await fetch(`/api/videos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isWatched: false }),
            })

            if (response.ok) {
                setVideos(videos.filter((video) => video.id !== id))
            }
        } catch (error) {
            console.error('Error un-watching video:', error)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            const response = await fetch(`/api/videos/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setVideos(videos.filter((video) => video.id !== id))
            }
        } catch (error) {
            console.error('Error deleting video:', error)
        }
    }

    const handleEdit = (video: Video) => {
        setEditVideo(video)
        setEditModalOpen(true)
    }

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
                // Fallback to empty array
                setPlatforms([])
            }
        }
        loadPlatforms()
    }, [])

    return (
        <div className='min-h-screen bg-background text-foreground'>
            <NavigationTabs />
            <main className='container mx-auto px-4 pt-32 pb-12 max-w-6xl'>
                {/* Header */}
                <div className='mb-8'>
                    <div className='flex items-center justify-between mb-2'>
                        <h1 className='text-2xl sm:text-3xl font-bold'>
                            Watched Videos
                        </h1>
                    </div>
                    <p className='text-gray-600 dark:text-gray-400'>
                        {videos.length} watched videos
                        {(searchQuery ||
                            selectedPlatforms.length > 0 ||
                            selectedTagIds.length > 0) &&
                            ` • ${filteredVideos.length} shown`}
                    </p>
                </div>

                {/* Search and Filters */}
                <div className='mb-8 space-y-4'>
                    {/* Search */}
                    <div className='relative'>
                        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                        <Input
                            type='text'
                            placeholder='Search videos...'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className='pl-10'
                        />
                    </div>

                    {/* Platform Filters */}
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

                {/* Video List */}
                <div>
                    <VideoList
                        videos={filteredVideos}
                        onMarkWatched={handleMarkWatched}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                    />
                    <VideoEditModal
                        video={editVideo}
                        open={editModalOpen}
                        onOpenChange={setEditModalOpen}
                        onSuccess={() => {
                            const fetchVideos = async () => {
                                setLoading(true)
                                try {
                                    const params = new URLSearchParams()
                                    params.set('watched', watched)
                                    if (searchQuery)
                                        params.set('search', searchQuery)
                                    for (const platform of selectedPlatforms) {
                                        params.append('platforms', platform)
                                    }
                                    for (const tagId of selectedTagIds) {
                                        params.append('tags', tagId.toString())
                                    }

                                    const response = await fetch(
                                        `/api/videos?${params}`,
                                    )
                                    if (response.ok) {
                                        const data = await response.json()
                                        setVideos(data)
                                    }
                                } catch (error) {
                                    console.error(
                                        'Error fetching videos:',
                                        error,
                                    )
                                } finally {
                                    setLoading(false)
                                }
                            }
                            fetchVideos()
                        }}
                    />
                </div>
            </main>
        </div>
    )
}
