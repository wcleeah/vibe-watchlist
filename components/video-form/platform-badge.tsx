'use client';

import { Youtube, Play, Tv, Gamepad2, Globe, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatformBadgeProps {
  platform: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outline' | 'ghost';
  className?: string;
}

const PLATFORM_CONFIGS: Record<string, { icon: any; color: string; bgColor: string }> = {
  youtube: {
    icon: Youtube,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200'
  },
  twitch: {
    icon: Gamepad2,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200'
  },
  netflix: {
    icon: Play,
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200'
  },
  nebula: {
    icon: Tv,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200'
  },
  vimeo: {
    icon: Video,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 border-blue-200'
  },
  dailymotion: {
    icon: Play,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200'
  },
  bilibili: {
    icon: Video,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200'
  },
  unknown: {
    icon: Globe,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200'
  }
};

export function PlatformBadge({
  platform,
  size = 'sm',
  variant = 'outline',
  className
}: PlatformBadgeProps) {
  const config = PLATFORM_CONFIGS[platform.toLowerCase()] || PLATFORM_CONFIGS.unknown;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const getDisplayName = (platform: string) => {
    const names: Record<string, string> = {
      youtube: 'YouTube',
      twitch: 'Twitch',
      netflix: 'Netflix',
      nebula: 'Nebula',
      vimeo: 'Vimeo',
      dailymotion: 'Dailymotion',
      bilibili: 'Bilibili'
    };
    return names[platform.toLowerCase()] || platform.charAt(0).toUpperCase() + platform.slice(1);
  };

  if (variant === 'ghost') {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 font-medium",
        config.color,
        className
      )}>
        <Icon className={iconSizes[size]} />
        <span className="capitalize">{getDisplayName(platform)}</span>
      </span>
    );
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 font-medium rounded-full border",
      sizeClasses[size],
      variant === 'filled'
        ? cn(config.bgColor, config.color)
        : cn("bg-white border-gray-200 text-gray-700"),
      className
    )}>
      <Icon className={iconSizes[size]} />
      <span className="capitalize">{getDisplayName(platform)}</span>
    </span>
  );
}

// Compact version for use in lists/cards
export function PlatformIcon({
  platform,
  size = 'sm',
  className
}: Omit<PlatformBadgeProps, 'variant'>) {
  const config = PLATFORM_CONFIGS[platform.toLowerCase()] || PLATFORM_CONFIGS.unknown;
  const Icon = config.icon;

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <Icon
      className={cn(
        iconSizes[size],
        config.color,
        className
      )}
      title={platform.charAt(0).toUpperCase() + platform.slice(1)}
    />
  );
}