export interface WatchStats {
    totalVideos: number
    watchedVideos: number
    unwatchedVideos: number
    watchProgress: number
    platformStats: Record<
        string,
        { total: number; watched: number; percentage: number }
    >
    tagStats: Record<
        string,
        { total: number; watched: number; percentage: number }
    >
    recentActivity: RecentActivity[]
}

export interface RecentActivity {
    id: number
    title: string
    platform: string
    watchedAt: string
    action: 'added' | 'watched'
}

export const OPERATION_LABELS: Record<string, string> = {
    platform_detection: 'Platform Detection',
    title_suggestion: 'Title Suggestion',
}
