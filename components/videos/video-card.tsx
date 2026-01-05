import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Video } from '@/lib/db/schema';
import { TagList } from '@/components/ui/tag';
import { ExternalLink, CheckCircle, Trash2, Youtube, Tv, Gamepad2, Copy } from 'lucide-react';

interface VideoWithTags extends Video {
  tags?: Array<{
    id: number;
    name: string;
    color?: string | null;
  }>;
}

interface VideoCardProps {
  video: VideoWithTags;
  onMarkWatched?: (id: number) => void;
  onDelete?: (id: number) => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (id: number, selected: boolean) => void;
}

const platformIcons = {
  youtube: Youtube,
  netflix: Tv,
  nebula: Tv,
  twitch: Gamepad2,
};

export function VideoCard({
  video,
  onMarkWatched,
  onDelete,
  isSelectable = false,
  isSelected = false,
  onSelectionChange
}: VideoCardProps) {
  const handleMarkWatched = () => {
    onMarkWatched?.(video.id);
  };

  const handleDelete = () => {
    onDelete?.(video.id);
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(video.url);
  };

  const PlatformIcon = platformIcons[video.platform] || Tv;

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 last:border-b-0">
      {/* File path header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        {isSelectable && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelectionChange?.(video.id, e.target.checked)}
            className="mr-1"
          />
        )}
        <span className="text-xs text-gray-500 dark:text-gray-400">📁</span>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {video.platform}/{video.title || 'Untitled Video'}.mp4
        </span>
      </div>

      {/* Code result content */}
      <div className="p-4">
        <div className="flex gap-4">
          {video.thumbnailUrl && (
            <div className="relative flex-shrink-0">
              <Image
                src={video.thumbnailUrl}
                alt={video.title || 'Video thumbnail'}
                width={180}
                height={100}
                className="w-45 h-25 object-cover rounded border border-gray-200 dark:border-gray-700"
              />
              <div className="absolute top-2 right-2 w-6 h-6 bg-gray-900 dark:bg-gray-100 rounded-full flex items-center justify-center">
                <PlatformIcon className="w-3.5 h-3.5 text-white dark:text-gray-900" />
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Syntax highlighted metadata */}
            <pre className="text-xs font-mono leading-relaxed text-gray-800 dark:text-gray-200">
              <div className="mb-2">
                <span className="text-blue-600 dark:text-blue-400">├──</span>{' '}
                <span className="text-purple-600 dark:text-purple-400">platform</span>:{' '}
                <span className="text-green-600 dark:text-green-400">&quot;{video.platform}&quot;</span>
              </div>
              <div className="mb-2">
                <span className="text-blue-600 dark:text-blue-400">├──</span>{' '}
                <span className="text-purple-600 dark:text-purple-400">title</span>:{' '}
                <span className="text-green-600 dark:text-green-400">&quot;{video.title || 'Untitled Video'}&quot;</span>
              </div>
              <div className="mb-2">
                <span className="text-blue-600 dark:text-blue-400">├──</span>{' '}
                <span className="text-purple-600 dark:text-purple-400">url</span>:{' '}
                <span className="text-yellow-600 dark:text-yellow-400">&quot;{video.url}&quot;</span>
              </div>
              {video.tags && video.tags.length > 0 && (
                <div className="mb-2">
                  <span className="text-blue-600 dark:text-blue-400">└──</span>{' '}
                  <span className="text-purple-600 dark:text-purple-400">tags</span>:{' '}
                  <span className="text-orange-600 dark:text-orange-400">[{video.tags.map(t => t.name).join(', ')}]</span>
                </div>
              )}
            </pre>

            {/* Tags display */}
            {video.tags && video.tags.length > 0 && (
              <div className="mt-3">
                <TagList tags={video.tags} size="sm" />
              </div>
            )}
          </div>

          {/* Desktop: Right sidebar with vertical actions */}
          <div className="hidden lg:flex flex-col gap-2 ml-6">
            <Button asChild variant="outline" size="sm" className="justify-start h-8 text-xs">
              <a href={video.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                watch()
              </a>
            </Button>

            {!video.isWatched && (
              <Button
                onClick={handleMarkWatched}
                variant="outline"
                size="sm"
                className="justify-start h-8 text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                markWatched()
              </Button>
            )}

            <Button
              onClick={handleCopyUrl}
              variant="outline"
              size="sm"
              className="justify-start h-8 text-xs"
            >
              <Copy className="w-3 h-3 mr-1" />
              copyUrl()
            </Button>

            {onDelete && (
              <Button
                onClick={handleDelete}
                variant="outline"
                size="sm"
                className="justify-start h-8 text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                delete()
              </Button>
            )}
          </div>
        </div>

        {/* Mobile: Bottom horizontal actions */}
        <div className="flex gap-2 mt-4 lg:hidden">
          <Button asChild variant="outline" size="sm" className="flex-1 h-8 text-xs">
            <a href={video.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              watch()
            </a>
          </Button>

          {!video.isWatched && (
            <Button
              onClick={handleMarkWatched}
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              markWatched()
            </Button>
          )}

          <Button
            onClick={handleCopyUrl}
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
          >
            <Copy className="w-3 h-3 mr-1" />
            copyUrl()
          </Button>

          {onDelete && (
            <Button
              onClick={handleDelete}
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              delete()
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}