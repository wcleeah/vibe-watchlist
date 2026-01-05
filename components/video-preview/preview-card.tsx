'use client';

import { useState } from 'react';
import { FileText, CheckCircle, Trash2, Loader2 } from 'lucide-react';
import { PLATFORM_NAMES } from '@/lib/utils/platform-utils';
import { MetadataDisplay, ThumbnailDisplay } from './metadata-components';
import { LoadingSkeleton } from './loading-skeleton';
import { ErrorDisplay } from './error-display';
import { PreviewCardProps } from './types';

export function PreviewCard({ video, showActions = false, onMarkWatched, onDelete, className }: PreviewCardProps) {
  const [loadingMarkWatched, setLoadingMarkWatched] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  if (video.isLoading) {
    return (
      <div className={`bg-white dark:bg-black rounded-lg border border-black dark:border-white p-6 min-h-[300px] flex items-center justify-center ${className}`}>
        <div className="text-lg text-gray-500 dark:text-gray-400">loading...</div>
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
            <h3 className="text-lg font-bold text-black dark:text-white font-mono truncate" title={video.title || 'Untitled Video'}>
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
            <div className="flex-1 min-w-0 flex items-center">
              <div className="rounded-lg p-4 font-mono w-full">
                <div className="text-sm">
                  {'{'}
                  <div className="ml-4 space-y-1">
                    <div><span className="text-purple-600 dark:text-purple-400">&quot;PLATFORM&quot;</span>: <span className="text-green-600 dark:text-green-400">&quot;{PLATFORM_NAMES[video.platform as keyof typeof PLATFORM_NAMES] || video.platform}&quot;</span>,</div>
                    {video.id && (
                      <div><span className="text-cyan-600 dark:text-cyan-400">&quot;ID&quot;</span>: <span className="text-cyan-600 dark:text-cyan-400">{video.id}</span>,</div>
                    )}
                    {video.tags && video.tags.length > 0 && (
                      <div><span className="text-purple-600 dark:text-purple-400">&quot;TAGS&quot;</span>: <span className="text-yellow-600 dark:text-yellow-400">[{video.tags.map(tag => `&quot;${tag.name}&quot;`).join(', ')}]</span></div>
                    )}
                  </div>
                  {'}'}
                </div>
                {video.error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <div className="font-mono text-sm text-red-600 dark:text-red-400">
                      &quot;ERROR&quot;: &quot;{video.error}&quot;
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Column (20%) - Full height on desktop, horizontal at bottom on mobile */}
        {showActions && (
          <div className="px-4 pt-4 pb-4 flex flex-col md:border-l border-black dark:border-white justify-center">
            {/* Main action buttons */}
            <div className="flex md:flex-col flex-row gap-2 justify-center mb-8">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 text-xs px-2 bg-primary text-primary-foreground dark:bg-white dark:text-black hover:bg-primary/90 dark:hover:bg-gray-100 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center font-bold"
              title="watch()"
            >
              watch()
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(video.url)}
              className="h-8 text-xs px-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center"
              title="copyUrl()"
            >
              copyUrl()
            </button>
              {!video.isWatched && onMarkWatched && (
                <button
                  onClick={async () => {
                    setLoadingMarkWatched(true);
                    try {
                      await onMarkWatched(video.id);
                    } finally {
                      setLoadingMarkWatched(false);
                    }
                  }}
                  disabled={loadingMarkWatched}
                  className="h-8 text-xs px-2 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center"
                  title="markWatched()"
                >
                  {loadingMarkWatched ? <Loader2 className="w-4 h-4 animate-spin" /> : 'markWatched()'}
                </button>
              )}
            </div>

            {/* Delete button separated at bottom */}
            {onDelete && (
              <div className="flex justify-center">
                <button
                  onClick={async () => {
                    setLoadingDelete(true);
                    try {
                      await onDelete(video.id);
                    } finally {
                      setLoadingDelete(false);
                    }
                  }}
                  disabled={loadingDelete}
                  className="h-8 text-xs px-2 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center"
                  title="delete()"
                >
                  {loadingDelete ? <Loader2 className="w-4 h-4 animate-spin" /> : 'delete()'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}