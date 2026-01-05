'use client';

import { useState, useEffect, useCallback } from 'react';
import { VideoList } from '@/components/videos/video-list';
import { NavigationTabs } from '@/components/navigation-tabs';
import { Video } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Youtube, Tv, Gamepad2, Globe } from 'lucide-react';

interface Tag {
  id: number;
  name: string;
  color?: string | null;
}

interface VideoWithTags extends Video {
  tags?: Tag[];
}

export default function ListPage() {
  const [videos, setVideos] = useState<VideoWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  // New filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk operations state
  const [selectedVideoIds, setSelectedVideoIds] = useState<number[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchVideos = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('watched', 'false');

      // Add search query
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      // Add platform filters
      if (selectedPlatforms.length > 0) {
        params.set('platforms', selectedPlatforms.join(','));
      }

      // Add sorting
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const response = await fetch(`/api/videos?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedPlatforms, sortBy, sortOrder]);

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

  useEffect(() => {
    fetchVideos();
    fetchTags();
  }, [fetchVideos, selectedTagIds]);

  const handleTagFilter = (tagId: number) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const clearTagFilters = () => {
    setSelectedTagIds([]);
  };

  const filteredVideos = selectedTagIds.length > 0
    ? videos.filter(video =>
        video.tags?.some(tag => selectedTagIds.includes(tag.id))
      )
    : videos;

  // Bulk operations functions
  const handleSelectionChange = (videoId: number, selected: boolean) => {
    setSelectedVideoIds(prev =>
      selected
        ? [...prev, videoId]
        : prev.filter(id => id !== videoId)
    );
  };

  const handleSelectAll = () => {
    setSelectedVideoIds(filteredVideos.map(video => video.id));
  };

  const handleSelectNone = () => {
    setSelectedVideoIds([]);
  };

  const handleBulkMarkWatched = async () => {
    if (selectedVideoIds.length === 0) return;

    setBulkLoading(true);
    try {
      const response = await fetch('/api/videos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'markWatched',
          videoIds: selectedVideoIds,
        }),
      });

      if (response.ok) {
        // Refresh videos and clear selection
        await fetchVideos();
        setSelectedVideoIds([]);
      }
    } catch (error) {
      console.error('Error bulk marking as watched:', error);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedVideoIds.length === 0) return;

    if (!confirm(`Delete ${selectedVideoIds.length} selected videos? This action cannot be undone.`)) {
      return;
    }

    setBulkLoading(true);
    try {
      const response = await fetch('/api/videos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'delete',
          videoIds: selectedVideoIds,
        }),
      });

      if (response.ok) {
        // Refresh videos and clear selection
        await fetchVideos();
        setSelectedVideoIds([]);
      }
    } catch (error) {
      console.error('Error bulk deleting videos:', error);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleMarkWatched = async (id: number) => {
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isWatched: true }),
      });

      if (response.ok) {
        setVideos(videos.filter(video => video.id !== id));
      }
    } catch (error) {
      console.error('Error marking video as watched:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isWatched: true }),
      });

      if (response.ok) {
        setVideos(videos.filter(video => video.id !== id));
      }
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavigationTabs />

      <main className="container mx-auto px-4 pt-32 pb-12 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold">My Watchlist</h1>

          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {videos.length} unwatched videos
            {(searchQuery || selectedPlatforms.length > 0 || selectedTagIds.length > 0) &&
              ` • ${filteredVideos.length} shown`
            }
          </p>
        </div>

        {/* Bulk Operations Toolbar */}
        {bulkMode && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedVideoIds.length} of {filteredVideos.length} videos selected
                </span>
            <div className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={selectedVideoIds.length === filteredVideos.length}
                    className="h-8"
                  >
                    selectAll()
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectNone}
                    disabled={selectedVideoIds.length === 0}
                    className="h-8"
                  >
                    selectNone()
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkMarkWatched}
                  disabled={selectedVideoIds.length === 0 || bulkLoading}
                  size="sm"
                  className="h-8 bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  {bulkLoading ? 'processing()' : `markWatched(${selectedVideoIds.length})`}
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  disabled={selectedVideoIds.length === 0 || bulkLoading}
                  size="sm"
                  className="h-8 bg-red-500 text-white hover:bg-red-600"
                >
                  {bulkLoading ? 'processing()' : `delete(${selectedVideoIds.length})`}
                </Button>
                <Button
                  onClick={() => {
                    setBulkMode(false);
                    setSelectedVideoIds([]);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Bulk Mode */}
        {!bulkMode && (
          <div className="mb-4">
            <Button
              onClick={() => setBulkMode(true)}
              variant="outline"
              size="sm"
            >
              Enable Bulk Operations
            </Button>
          </div>
        )}

        {/* Advanced Filters */}
        <div className="mb-6 space-y-4">
          {/* Search and Sort Row */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex gap-2">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-md bg-white dark:bg-gray-900 text-sm"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="updatedAt-desc">Recently Updated</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
              </select>
            </div>
          </div>

          {/* Platform Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Filter className="w-4 h-4" />
              Platforms:
            </div>
            <div className="flex flex-wrap gap-2">
               {[
                 { key: 'youtube', label: 'YouTube', icon: Youtube, color: 'hover:bg-red-50 dark:hover:bg-red-950' },
                 { key: 'netflix', label: 'Netflix', icon: Tv, color: 'hover:bg-red-50 dark:hover:bg-red-950' },
                 { key: 'nebula', label: 'Nebula', icon: Tv, color: 'hover:bg-purple-50 dark:hover:bg-purple-950' },
                 { key: 'twitch', label: 'Twitch', icon: Gamepad2, color: 'hover:bg-purple-50 dark:hover:bg-purple-950' },
                 { key: 'unknown', label: 'Unknown', icon: Globe, color: 'hover:bg-gray-50 dark:hover:bg-gray-950' },
               ].map(({ key, label, icon: Icon, color }) => (
                <Button
                  key={key}
                  variant={selectedPlatforms.includes(key) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedPlatforms(prev =>
                      prev.includes(key)
                        ? prev.filter(p => p !== key)
                        : [...prev, key]
                    );
                  }}
                  className={`h-8 ${selectedPlatforms.includes(key) ? 'bg-gray-100 dark:bg-gray-800' : color}`}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchQuery || selectedPlatforms.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: &quot;{searchQuery}&quot;
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {selectedPlatforms.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Platforms: {selectedPlatforms.join(', ')}
                  <button
                    onClick={() => setSelectedPlatforms([])}
                    className="ml-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by tags:</h2>
              {selectedTagIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearTagFilters}
                  className="h-auto p-1 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleTagFilter(tag.id)}
                  className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                    selectedTagIds.includes(tag.id)
                      ? 'bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  style={selectedTagIds.includes(tag.id) ? {} : {
                    borderColor: tag.color || '#6b7280',
                    color: tag.color || '#6b7280'
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Videos List */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-40 mb-4"></div>
              </div>
            ))}
          </div>
        ) : (
          <VideoList
            videos={filteredVideos}
            onMarkWatched={handleMarkWatched}
            onDelete={handleDelete}
            isSelectable={bulkMode}
            selectedIds={selectedVideoIds}
            onSelectionChange={handleSelectionChange}
          />
        )}
      </main>
    </div>
  );
}