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
      <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 min-h-[300px] ${className}`}>
        <LoadingSkeleton />
      </div>
    );
  }

  if (video.error) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 min-h-[300px] ${className}`}>
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

  const borderClass = showActions ? 'border border-gray-200' : '';

  return (
    <div className={`bg-white rounded-lg ${borderClass} min-h-[200px] ${className}`}>
      <div className="p-4">
        {/* Top: Title */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 font-mono">
            {video.title || 'Untitled Video'}
          </h3>
        </div>

        {/* Bottom: Horizontal split */}
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="flex-shrink-0 w-24 h-16">
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
            <div className="text-sm text-gray-600 space-y-1">
              <div>Platform: {PLATFORM_NAMES[video.platform as keyof typeof PLATFORM_NAMES] || video.platform}</div>
              {video.tags && video.tags.length > 0 && (
                <div>Tags: {video.tags.map(tag => tag.name).join(', ')}</div>
              )}
              {video.id && <div className="text-xs text-gray-500">ID: {video.id}</div>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              title="Copy URL"
            >
              Copy URL
            </a>
            {showActions && onDelete && (
              <button
                onClick={() => onDelete(video.id)}
                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                title="Delete"
              >
                Delete
              </button>
            )}
            {showActions && !video.isWatched && onMarkWatched && (
              <button
                onClick={() => onMarkWatched(video.id)}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
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