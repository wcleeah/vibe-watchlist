'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X, Youtube, Tv, Gamepad2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { VideoList } from '@/components/videos/video-list';
import { NavigationTabs } from '@/components/navigation-tabs';
import { VideoWithTags as Video } from '@/types/video';

export default function WatchedPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [allTags, setAllTags] = useState<{ id: number; name: string; color?: string }[]>([]);

  // Always show watched videos
  const watched = 'true';

  // Fetch videos on mount and when filters change
  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('watched', watched);
        if (searchQuery) params.set('search', searchQuery);
        selectedPlatforms.forEach(platform => params.set('platforms', platform));
        selectedTagIds.forEach(tagId => params.set('tags', tagId.toString()));

        const response = await fetch(`/api/videos?${params}`);
        if (response.ok) {
          const data = await response.json();
          setVideos(data);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [watched, searchQuery, selectedPlatforms, selectedTagIds]);

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags');
        if (response.ok) {
          const tags = await response.json();
          setAllTags(tags);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };
    fetchTags();
  }, []);

  // Filter videos based on current filters
  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      const matchesSearch = !searchQuery ||
        video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.tags?.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPlatform = selectedPlatforms.length === 0 || selectedPlatforms.includes(video.platform);

      const matchesTags = selectedTagIds.length === 0 ||
        video.tags?.some(tag => selectedTagIds.includes(tag.id));

      return matchesSearch && matchesPlatform && matchesTags;
    });
  }, [videos, searchQuery, selectedPlatforms, selectedTagIds]);

  const handleMarkWatched = async (id: number) => {
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isWatched: false }),
      });

      if (response.ok) {
        setVideos(videos.filter(video => video.id !== id));
      }
    } catch (error) {
      console.error('Error un-watching video:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setVideos(videos.filter(video => video.id !== id));
      }
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  const handlePlatformFilter = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleTagFilter = (tagId: number) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavigationTabs />
      <main className="container mx-auto px-4 pt-32 pb-12 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold">Watched Videos</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {videos.length} watched videos
            {(searchQuery || selectedPlatforms.length > 0 || selectedTagIds.length > 0) &&
              ` • ${filteredVideos.length} shown`
            }
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Platform Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Filter className="w-4 h-4" />
              Platform:
            </div>
            {[
              { key: 'youtube', label: 'YouTube', icon: Youtube },
              { key: 'netflix', label: 'Netflix', icon: Tv },
              { key: 'nebula', label: 'Nebula', icon: Gamepad2 },
              { key: 'twitch', label: 'Twitch', icon: Tv },
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={selectedPlatforms.includes(key) ? "default" : "outline"}
                size="sm"
                onClick={() => handlePlatformFilter(key)}
                className="flex items-center gap-2 w-20 sm:w-24"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Tag className="w-4 h-4" />
                Tags:
              </div>
              {allTags.map(tag => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1"
                  onClick={() => handleTagFilter(tag.id)}
                  style={selectedTagIds.includes(tag.id) ? {} : {
                    borderColor: tag.color || '#6b7280',
                    color: tag.color || '#6b7280'
                  }}
                >
                  {selectedTagIds.includes(tag.id) && <X className="w-3 h-3" />}
                  #{tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Video List */}
        <VideoList
          videos={filteredVideos}
          loading={loading}
          onMarkWatched={handleMarkWatched}
          onDelete={handleDelete}
          isSelectable={false}
        />
      </main>
    </div>
  );
}