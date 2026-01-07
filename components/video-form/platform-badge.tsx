'use client';

import { Youtube, Play, Tv, Gamepad2, Globe, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlatforms } from '@/hooks/use-platforms';

interface PlatformBadgeProps {
  platform: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outline' | 'ghost';
  className?: string;
}

// Helper function to get icon component from string
function getIconComponent(iconName: string) {
  const iconMap: Record<string, any> = {
    Youtube: Youtube,
    Play: Play,
    Tv: Tv,
    Gamepad2: Gamepad2,
    Globe: Globe,
    Video: Video,
    // Add more icon mappings as needed
  };
  return iconMap[iconName] || Globe;
}

// Helper function to convert hex color to Tailwind color class
function getColorClass(hexColor: string): string {
  // Simple mapping for common colors
  const colorMap: Record<string, string> = {
    '#ff0000': 'red',
    '#9146ff': 'purple',
    '#e50914': 'red',
    '#ffffff': 'gray',
    '#6b7280': 'gray',
  };
  return colorMap[hexColor] || 'gray';
}

// Fallback configs for when platform data isn't loaded
function getFallbackConfig(platform: string) {
  const fallbackMap: Record<string, { icon: any; color: string; bgColor: string }> = {
    youtube: { icon: Youtube, color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
    twitch: { icon: Gamepad2, color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
    netflix: { icon: Play, color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
    nebula: { icon: Tv, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
    unknown: { icon: Globe, color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200' },
  };
  return fallbackMap[platform.toLowerCase()] || fallbackMap.unknown;
}

export function PlatformBadge({
  platform,
  size = 'sm',
  variant = 'outline',
  className
}: PlatformBadgeProps) {
  const { platforms } = usePlatforms();

  // Get platform config from loaded data, or use fallback
  const platformConfig = platforms.find(p => p.platformId === platform);
  const config = platformConfig ? {
    icon: getIconComponent(platformConfig.icon || 'Globe'),
    color: `text-${getColorClass(platformConfig.color || '#6b7280')}`,
    bgColor: `bg-${getColorClass(platformConfig.color || '#6b7280')}-50 border-${getColorClass(platformConfig.color || '#6b7280')}-200`
  } : getFallbackConfig(platform);
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
    // Use display name from platform config if available
    const platformConfig = platforms.find(p => p.platformId === platform);
    if (platformConfig?.displayName) {
      return platformConfig.displayName;
    }

    // Fallback to capitalized platform name
    return platform.charAt(0).toUpperCase() + platform.slice(1);
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
  const { platforms } = usePlatforms();

  // Get platform config from loaded data, or use fallback
  const platformConfig = platforms.find(p => p.platformId === platform);
  const config = platformConfig ? {
    icon: getIconComponent(platformConfig.icon || 'Globe'),
    color: `text-${getColorClass(platformConfig.color || '#6b7280')}`
  } : getFallbackConfig(platform);
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