export type VideoPlatform = 'youtube' | 'netflix' | 'nebula' | 'twitch';

// Platform-specific utilities and constants

export const PLATFORM_NAMES = {
  youtube: 'YouTube',
  netflix: 'Netflix',
  nebula: 'Nebula',
  twitch: 'Twitch',
} as const;

export const PLATFORM_URLS = {
  youtube: 'https://www.youtube.com',
  netflix: 'https://www.netflix.com',
  nebula: 'https://nebula.tv',
  twitch: 'https://www.twitch.tv',
} as const;