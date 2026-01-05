import { VideoMetadata, VideoWithTags } from '@/types/video';

export interface VideoData extends Omit<VideoWithTags, 'tags'> {
  tags?: Array<{
    id: number;
    name: string;
    color?: string | null;
  }>;
  metadata?: VideoMetadata | null;
  isLoading?: boolean;
  error?: string | null;
}

export interface PreviewCardProps {
  video: VideoData;
  variant?: 'default' | 'compact';
  showActions?: boolean;
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