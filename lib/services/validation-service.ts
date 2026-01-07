import { parseVideoUrl, VideoPlatform } from '@/lib/utils/url-parser';

// Update hardcoded validation arrays to be dynamic
// This will be replaced with database queries in Phase 2

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  platform?: VideoPlatform;
  videoId?: string;
}

export class ValidationService {
  static async validateUrl(url: string): Promise<ValidationResult> {
    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        error: 'URL is required',
      };
    }

    try {
      const result = await parseVideoUrl(url.trim());

      if (!result.isValid) {
        return {
          isValid: false,
          error: 'Please enter a valid YouTube, Netflix, Nebula, or Twitch URL',
        };
      }

      return {
        isValid: true,
        platform: result.platform,
        videoId: result.videoId,
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid URL format',
      };
    }
  }

  static validateTagName(name: string): ValidationResult {
    if (!name || typeof name !== 'string') {
      return {
        isValid: false,
        error: 'Tag name is required',
      };
    }

    const trimmed = name.trim();

    if (trimmed.length === 0) {
      return {
        isValid: false,
        error: 'Tag name cannot be empty',
      };
    }

    if (trimmed.length > 50) {
      return {
        isValid: false,
        error: 'Tag name must be less than 50 characters',
      };
    }

    // Check for invalid characters
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
      return {
        isValid: false,
        error: 'Tag name can only contain letters, numbers, spaces, hyphens, and underscores',
      };
    }

    return {
      isValid: true,
    };
  }

  static validateVideoTitle(title: string): ValidationResult {
    if (!title || typeof title !== 'string') {
      return {
        isValid: false,
        error: 'Title is required',
      };
    }

    const trimmed = title.trim();

    if (trimmed.length === 0) {
      return {
        isValid: false,
        error: 'Title cannot be empty',
      };
    }

    if (trimmed.length > 200) {
      return {
        isValid: false,
        error: 'Title must be less than 200 characters',
      };
    }

    return {
      isValid: true,
    };
  }

  static validatePlatform(platform: string): ValidationResult {
    const validPlatforms: VideoPlatform[] = ['youtube', 'netflix', 'nebula', 'twitch'];

    if (!platform || typeof platform !== 'string') {
      return {
        isValid: false,
        error: 'Platform is required',
      };
    }

    if (!validPlatforms.includes(platform as VideoPlatform)) {
      return {
        isValid: false,
        error: 'Invalid platform selected',
      };
    }

    return {
      isValid: true,
    };
  }

  static validateTagIds(tagIds: number[]): ValidationResult {
    if (!Array.isArray(tagIds)) {
      return {
        isValid: false,
        error: 'Tag IDs must be an array',
      };
    }

    for (const id of tagIds) {
      if (typeof id !== 'number' || id <= 0) {
        return {
          isValid: false,
          error: 'All tag IDs must be positive numbers',
        };
      }
    }

    return {
      isValid: true,
    };
  }
}