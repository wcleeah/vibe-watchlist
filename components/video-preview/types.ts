import { VideoMetadata } from '@/types/video';
import { Tag } from '@/types/tag';

export interface VideoData {
  id: number;
  url: string;
  title: string | null;
  platform: string;
  thumbnailUrl: string | null;
  isWatched: boolean | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  tags?: Tag[];
  highlightedTitle?: string;
  highlightedTags?: Tag[];
  metadata?: VideoMetadata | null;
  isLoading?: boolean;
  error?: string | null;
}

export interface PreviewCardProps {
  video: VideoData;
  variant?: 'default' | 'compact';
  showActions?: boolean;
  onMarkWatched?: (id: number) => void;
  onDelete?: (id: number) => void;
  className?: string;
}

export interface LoadingSkeletonProps {
  className?: string;
}

export interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}