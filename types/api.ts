import { VideoWithTags } from './video';
import { Tag } from './tag';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface VideoCreateRequest {
  url: string;
  title?: string;
  platform: string;
  thumbnailUrl?: string;
  tagIds?: number[];
}

export interface VideoUpdateRequest {
  title?: string;
  isWatched?: boolean;
  tagIds?: number[];
}

export interface TagCreateRequest {
  name: string;
  color?: string;
}

export interface VideoFilters {
  watched?: boolean;
  platforms?: string[];
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface VideosApiResponse extends PaginatedResponse<VideoWithTags> {}

export interface TagsApiResponse extends ApiResponse<Tag[]> {}