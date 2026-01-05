export type VideoPlatform = 'youtube' | 'netflix' | 'nebula' | 'twitch' | 'unknown';

export const PLATFORM_NAMES = {
  youtube: 'YouTube',
  netflix: 'Netflix',
  nebula: 'Nebula',
  twitch: 'Twitch',
  unknown: 'Unknown Platform',
} as const;

export const PLATFORM_URLS = {
  youtube: 'https://www.youtube.com',
  netflix: 'https://www.netflix.com',
  nebula: 'https://nebula.tv',
  twitch: 'https://www.twitch.tv',
} as const;