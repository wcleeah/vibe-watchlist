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
    <div className={`bg-white dark:bg-black rounded-lg ${borderClass} min-h-[240px] ${className}`}>
      {/* Responsive layout: 2-column on desktop, stacked on mobile */}
      <div className={`min-h-[240px] ${showActions ? 'grid grid-cols-1 md:grid-cols-[8fr_2fr]' : ''}`}>
        {/* Content Column (full width when no actions, 80% when actions shown) */}
        <div className="px-4 pt-4 pb-4 space-y-1">
          {/* Title Section */}
          <div className="pb-2 border-b border-black dark:border-white">
            <h3 className="text-lg font-bold text-black dark:text-white font-mono truncate">
              {video.title || 'Untitled Video'}
            </h3>
          </div>

          {/* Thumbnail + Content Row */}
          <div className="flex gap-4">
            {/* Thumbnail */}
            <div className="flex-shrink-0 h-[171px] w-[304px]">
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
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div className="truncate">Platform: {PLATFORM_NAMES[video.platform as keyof typeof PLATFORM_NAMES] || video.platform}</div>
                {video.tags && video.tags.length > 0 && (
                  <div className="truncate">Tags: {video.tags.map(tag => tag.name).join(', ')}</div>
                )}
                {video.id && <div className="text-xs text-black dark:text-white truncate">ID: {video.id}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Action Column (20%) - Full height on desktop, horizontal at bottom on mobile */}
        {showActions && (
          <div className="px-4 pt-4 pb-4 flex md:flex-col flex-row gap-2 md:border-l border-black dark:border-white md:justify-start justify-center">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-7 text-xs px-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded shadow-sm hover:shadow-md transition-all"
              title="watch()"
            >
              watch()
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(video.url)}
              className="h-7 px-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded shadow-sm hover:shadow-md transition-all"
              title="copyUrl()"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            {onDelete && (
              <button
                onClick={() => onDelete(video.id)}
                className="h-7 text-xs px-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded shadow-sm hover:shadow-md transition-all"
                title="delete()"
              >
                delete()
              </button>
            )}
            {!video.isWatched && onMarkWatched && (
              <button
                onClick={() => onMarkWatched(video.id)}
                className="h-7 text-xs px-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded shadow-sm hover:shadow-md transition-all"
                title="markWatched()"
              >
                markWatched()
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}