import { PreviewCard } from '@/components/video-preview';
import { Video } from '@/lib/db/schema';
import { Tag } from '@/types/tag';
import { useMemo } from 'react';

interface VideoWithTags extends Video {
  tags?: Tag[];
  highlightedTitle?: string;
  highlightedTags?: Tag[];
}

interface VideoListProps {
  videos: VideoWithTags[];
  onMarkWatched?: (id: number) => void;
  onDelete?: (id: number) => void;
  isSelectable?: boolean;
  selectedIds?: number[];
  onSelectionChange?: (id: number, selected: boolean) => void;
}

export function VideoList({
  videos,
  onMarkWatched,
  onDelete,
  isSelectable = false,
  selectedIds = [],
  onSelectionChange
}: VideoListProps) {
  // Memoize selected state for each video to prevent unnecessary re-renders
  const selectedStates = useMemo(() => {
    const states: Record<number, boolean> = {};
    videos.forEach(video => {
      states[video.id] = selectedIds.includes(video.id);
    });
    return states;
  }, [videos, selectedIds]);
  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-base font-medium mb-1 font-mono">No videos found</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
          {'//'} Add your first video above to get started
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      {videos.map((video) => (
        <div key={video.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <PreviewCard
            video={{
              id: video.id,
              url: video.url,
              title: video.title,
              platform: video.platform,
              thumbnailUrl: video.thumbnailUrl,
              isWatched: video.isWatched,
              createdAt: video.createdAt,
              updatedAt: video.updatedAt,
              tags: video.tags || [],
              highlightedTitle: video.highlightedTitle,
              highlightedTags: video.highlightedTags,
            }}
            showActions={true}
            onMarkWatched={onMarkWatched}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}