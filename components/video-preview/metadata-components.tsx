'use client';

import Image from 'next/image';
import { VideoData } from './types';
import { Tag } from '@/types/tag';
import { PLATFORM_NAMES } from '@/lib/utils/platform-utils';

interface MetadataDisplayProps {
  video: VideoData;
  className?: string;
}

export function MetadataDisplay({ video, className }: MetadataDisplayProps) {
  const displayTitle = video.highlightedTitle || video.title || 'Untitled';

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Title */}
      <div className="font-mono text-sm">
        <span className="text-purple-600 dark:text-purple-400">title:</span>{' '}
        <span className="text-green-600 dark:text-green-400">
          {displayTitle.includes('<mark>') ? (
            <span dangerouslySetInnerHTML={{ __html: `&ldquo;${displayTitle}&rdquo;` }} />
          ) : (
            `&ldquo;${displayTitle}&rdquo;`
          )}
        </span>
      </div>

      {/* Platform */}
      <div className="font-mono text-sm">
        <span className="text-purple-600 dark:text-purple-400">platform:</span>{' '}
        <span className="text-blue-600 dark:text-blue-400">&ldquo;{video.platform}&rdquo;</span>
      </div>

      {/* URL */}
      <div className="font-mono text-sm">
        <span className="text-purple-600 dark:text-purple-400">url:</span>{' '}
        <span className="text-yellow-600 dark:text-yellow-400">&ldquo;{video.url}&rdquo;</span>
      </div>

      {/* Author (YouTube only) */}
      {video.metadata?.authorName && (
        <div className="font-mono text-sm">
          <span className="text-purple-600 dark:text-purple-400">author:</span>{' '}
          <span className="text-cyan-600 dark:text-cyan-400">&ldquo;{video.metadata.authorName}&rdquo;</span>
        </div>
      )}

      {/* Tags */}
      {video.tags && video.tags.length > 0 && (
        <div className="font-mono text-sm">
          <span className="text-purple-600 dark:text-purple-400">tags:</span>{' '}
          <span className="text-pink-600 dark:text-pink-400">
            [{video.tags.map((t: Tag) => `"${t.name}"`).join(', ')}]
          </span>
        </div>
      )}
    </div>
  );
}

interface ThumbnailDisplayProps {
  video: VideoData;
  className?: string;
}

export function ThumbnailDisplay({ video, className }: ThumbnailDisplayProps) {
  if (!video.thumbnailUrl) {
    return (
      <div className={`w-full max-w-xs mx-auto h-32 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center ${className}`}>
        <span className="text-gray-500 dark:text-gray-400 text-sm">No thumbnail</span>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Image
        src={video.thumbnailUrl}
        alt={video.title || 'Video thumbnail'}
        fill
        className="object-contain rounded border border-gray-200 dark:border-gray-700"
      />
    </div>
  );
}

interface TagDisplayProps {
  video: VideoData;
  className?: string;
}

export function TagDisplay({ video, className }: TagDisplayProps) {
  if (!video.tags || video.tags.length === 0) return null;

  return (
    <div className={`font-mono text-sm ${className}`}>
      <span className="text-purple-600 dark:text-purple-400">tags:</span>{' '}
      <span className="text-pink-600 dark:text-pink-400">
        [{video.tags.map((t: Tag) => `"${t.name}"`).join(', ')}]
      </span>
    </div>
  );
}