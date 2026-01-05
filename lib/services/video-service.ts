import { VideoCreateRequest, VideoUpdateRequest, VideoFilters, VideosApiResponse } from '@/types/api';
import { VideoWithTags } from '@/types/video';

export class VideoService {
  private static readonly API_BASE = '/api/videos';

  static async create(data: VideoCreateRequest): Promise<VideoWithTags> {
    const response = await fetch(this.API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create video');
    }

    return response.json();
  }

  static async update(id: number, data: VideoUpdateRequest): Promise<VideoWithTags> {
    const response = await fetch(`${this.API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update video');
    }

    return response.json();
  }

  static async delete(id: number): Promise<void> {
    const response = await fetch(`${this.API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete video');
    }
  }

  static async getAll(filters: VideoFilters = {}): Promise<VideosApiResponse> {
    const params = new URLSearchParams();

    if (filters.watched !== undefined) {
      params.set('watched', filters.watched.toString());
    }

    if (filters.platforms?.length) {
      params.set('platforms', filters.platforms.join(','));
    }

    if (filters.search) {
      params.set('search', filters.search);
    }

    if (filters.sortBy) {
      params.set('sortBy', filters.sortBy);
    }

    if (filters.sortOrder) {
      params.set('sortOrder', filters.sortOrder);
    }

    if (filters.limit) {
      params.set('limit', filters.limit.toString());
    }

    if (filters.offset) {
      params.set('offset', filters.offset.toString());
    }

    const response = await fetch(`${this.API_BASE}?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch videos');
    }

    return response.json();
  }

  static async bulkUpdate(ids: number[], data: Partial<VideoUpdateRequest>): Promise<void> {
    const response = await fetch(`${this.API_BASE}/bulk`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids, ...data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to bulk update videos');
    }
  }

  static async bulkDelete(ids: number[]): Promise<void> {
    const response = await fetch(`${this.API_BASE}/bulk`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error('Failed to bulk delete videos');
    }
  }
}