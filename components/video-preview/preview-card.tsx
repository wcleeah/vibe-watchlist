'use client';

import { FileText, CheckCircle, Trash2 } from 'lucide-react';
import { PLATFORM_NAMES } from '@/lib/utils/platform-utils';
import { MetadataDisplay, ThumbnailDisplay } from './metadata-components';
import { LoadingSkeleton } from './loading-skeleton';
import { ErrorDisplay } from './error-display';
import { PreviewCardProps } from './types';

export function PreviewCard({ video, showActions = false, onMarkWatched, onDelete, className }: PreviewCardProps) {
  if (video.isLoading) {
    return (
      <div className={`bg-white dark:bg-black rounded-lg border border-black dark:border-white p-6 min-h-[300px] ${className}`}>
        <LoadingSkeleton />
      </div>
    );
  }

  if (video.error) {
    return (
      <div className={`bg-white dark:bg-black rounded-lg border border-black dark:border-white p-6 min-h-[300px] ${className}`}>
        <ErrorDisplay error={video.error} />
      </div>
    );
  }

  // Platform background colors
  const platformBackgrounds = {
    youtube: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    netflix: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    nebula: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    twitch: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  };

  const platformAccentColors = {
    youtube: 'text-red-600 dark:text-red-400',
    netflix: 'text-red-600 dark:text-red-400',
    nebula: 'text-purple-600 dark:text-purple-400',
    twitch: 'text-purple-600 dark:text-purple-400',
  };

  const borderClass = showActions ? 'border border-black dark:border-white' : '';

  return (
    <div className={`bg-white dark:bg-black rounded-lg ${borderClass} min-h-[200px] ${className}`}>
      <div className="p-4">
        {/* Top: Title */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-black dark:text-white font-mono">
            {video.title || 'Untitled Video'}
          </h3>
        </div>

        {/* Bottom: Horizontal split */}
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="flex-shrink-0 w-48 h-28">
            {video.thumbnailUrl ? (
              <ThumbnailDisplay video={video} />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-black dark:text-white space-y-1">
              <div>Platform: {PLATFORM_NAMES[video.platform as keyof typeof PLATFORM_NAMES] || video.platform}</div>
              {video.tags && video.tags.length > 0 && (
                <div>Tags: {video.tags.map(tag => tag.name).join(', ')}</div>
              )}
              {video.id && <div className="text-xs text-black dark:text-white">ID: {video.id}</div>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-2 bg-black dark:bg-white text-white dark:text-black rounded shadow-sm hover:shadow-md transition-all transform hover:scale-105"
              title="Watch Now"
            >
              Watch Now
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(video.url)}
              className="text-xs px-3 py-2 bg-black dark:bg-white text-white dark:text-black rounded shadow-sm hover:shadow-md transition-all transform hover:scale-105"
              title="Copy URL"
            >
              Copy URL
            </button>
            {showActions && onDelete && (
              <button
                onClick={() => onDelete(video.id)}
                className="text-xs px-3 py-2 bg-black dark:bg-white text-white dark:text-black rounded shadow-sm hover:shadow-md transition-all transform hover:scale-105"
                title="Delete"
              >
                Delete
              </button>
            )}
            {showActions && !video.isWatched && onMarkWatched && (
              <button
                onClick={() => onMarkWatched(video.id)}
                className="text-xs px-3 py-2 bg-black dark:bg-white text-white dark:text-black rounded shadow-sm hover:shadow-md transition-all transform hover:scale-105"
                title="Mark Watched"
              >
                Watched
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}