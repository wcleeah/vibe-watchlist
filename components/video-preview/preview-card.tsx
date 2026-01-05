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

  return (
    <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg border min-h-[300px] ${
      platformBackgrounds[video.platform as keyof typeof platformBackgrounds] ||
      'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
    } ${className}`}>
      <div className="p-6">
        {/* File header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <FileText className={`w-5 h-5 ${
            platformAccentColors[video.platform as keyof typeof platformAccentColors] ||
            'text-gray-400'
          }`} />
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {video.platform === 'youtube' && '📺'}
              {video.platform === 'netflix' && '🎬'}
              {video.platform === 'nebula' && '🌌'}
              {video.platform === 'twitch' && '🎮'}
              {!['youtube', 'netflix', 'nebula', 'twitch'].includes(video.platform) && '📄'}
            </span>
            <span className={`text-sm font-mono font-semibold ${
              platformAccentColors[video.platform as keyof typeof platformAccentColors] ||
              'text-gray-600 dark:text-gray-300'
            }`}>
              {PLATFORM_NAMES[video.platform as keyof typeof PLATFORM_NAMES] || video.platform} Video
            </span>
          </div>
          {video.id && (
            <span className={`text-xs font-mono ml-auto ${
              platformAccentColors[video.platform as keyof typeof platformAccentColors] ||
              'text-gray-400'
            } opacity-75`}>
              ID: {video.id}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4">
          <MetadataDisplay video={video} />

          {/* Thumbnail */}
          {video.thumbnailUrl && (
            <div className="mt-6">
              <div className="font-mono text-sm text-purple-600 dark:text-purple-400 mb-2">thumbnail:</div>
              <ThumbnailDisplay video={video} />
            </div>
          )}
        </div>

        {/* Action buttons */}
        {showActions && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Watch
              </a>

              {!video.isWatched && onMarkWatched && (
                <button
                  onClick={() => onMarkWatched(video.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Watched
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(video.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}