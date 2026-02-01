import {
    Gamepad2,
    Globe,
    type LucideIcon,
    Play,
    Tv,
    Video,
    Youtube,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
    youtube: Youtube,
    tv: Tv,
    gamepad2: Gamepad2,
    globe: Globe,
    video: Video,
    play: Play,
}

/**
 * Get a Lucide icon component from an icon name string.
 * Falls back to Globe icon if the name is not found.
 * @param iconName - Case-insensitive icon name
 */
export function getIconComponent(iconName: string): LucideIcon {
    return iconMap[iconName.toLowerCase()] || Globe
}
