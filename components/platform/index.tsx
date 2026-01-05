'use client';

import { VideoPlatform } from '@/lib/utils/url-parser';
import { PLATFORM_NAMES } from '@/lib/utils/platform-utils';
import { Youtube, Tv, Gamepad2, Globe } from 'lucide-react';

interface PlatformIconProps {
  platform: VideoPlatform;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PlatformIcon({ platform, size = 'md', className }: PlatformIconProps) {
  const iconMap = {
    youtube: Youtube,
    netflix: Tv,
    nebula: Tv,
    twitch: Gamepad2,
    unknown: Globe,
  };

  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  const IconComponent = iconMap[platform];

  return (
    <div className={`inline-flex items-center justify-center ${sizeClass} ${className || ''}`}>
      <IconComponent />
    </div>
  );
}

interface PlatformBadgeProps {
  platform: VideoPlatform;
  variant?: 'default' | 'outline';
  className?: string;
}

export function PlatformBadge({ platform, variant = 'default', className }: PlatformBadgeProps) {
  const colors = {
    youtube: 'bg-red-100 text-red-800 border-red-200',
    netflix: 'bg-red-100 text-red-800 border-red-200',
    nebula: 'bg-purple-100 text-purple-800 border-purple-200',
    twitch: 'bg-purple-100 text-purple-800 border-purple-200',
    unknown: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const colorClass = colors[platform] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
      variant === 'outline' ? 'bg-transparent' : colorClass
    } ${className || ''}`}>
      <PlatformIcon platform={platform} size="sm" className="mr-1" />
      {PLATFORM_NAMES[platform]}
    </span>
  );
}

interface PlatformThemeProps {
  platform: VideoPlatform;
  children: (theme: {
    backgroundClass: string;
    borderClass: string;
    accentClass: string;
    icon: React.ReactNode;
  }) => React.ReactNode;
}

export function PlatformTheme({ platform, children }: PlatformThemeProps) {
  const themes = {
    youtube: {
      backgroundClass: 'bg-red-50 dark:bg-red-900/20',
      borderClass: 'border-red-200 dark:border-red-800',
      accentClass: 'text-red-600 dark:text-red-400',
      icon: '📺',
    },
    netflix: {
      backgroundClass: 'bg-red-50 dark:bg-red-900/20',
      borderClass: 'border-red-200 dark:border-red-800',
      accentClass: 'text-red-600 dark:text-red-400',
      icon: '🎬',
    },
    nebula: {
      backgroundClass: 'bg-purple-50 dark:bg-purple-900/20',
      borderClass: 'border-purple-200 dark:border-purple-800',
      accentClass: 'text-purple-600 dark:text-purple-400',
      icon: '🌌',
    },
    twitch: {
      backgroundClass: 'bg-purple-50 dark:bg-purple-900/20',
      borderClass: 'border-purple-200 dark:border-purple-800',
      accentClass: 'text-purple-600 dark:text-purple-400',
      icon: '🎮',
    },
    unknown: {
      backgroundClass: 'bg-gray-50 dark:bg-gray-900/20',
      borderClass: 'border-gray-200 dark:border-gray-800',
      accentClass: 'text-gray-600 dark:text-gray-400',
      icon: '🌐',
    },
  };

  const theme = themes[platform] || {
    backgroundClass: 'bg-gray-50 dark:bg-gray-900',
    borderClass: 'border-gray-200 dark:border-gray-800',
    accentClass: 'text-gray-600 dark:text-gray-400',
    icon: '📄',
  };

  return <>{children(theme)}</>;
}