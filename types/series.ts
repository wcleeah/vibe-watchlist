import type { Series as DbSeries, Tag } from '@/lib/db/schema'

// Schedule types - 'none' is for backlog series without a schedule
export type ScheduleType = 'daily' | 'weekly' | 'custom' | 'none'

export type DayOfWeek =
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday'

export interface DailySchedule {
    interval: number
}

export interface WeeklySchedule {
    days: DayOfWeek[]
}

export interface CustomSchedule {
    interval: number
}

// Empty schedule for backlog series
export type NoSchedule = {}

export type ScheduleValue =
    | DailySchedule
    | WeeklySchedule
    | CustomSchedule
    | NoSchedule

// Content mode for the add form
export type ContentMode = 'video' | 'series' | 'playlist'

// Series with typed schedule value
export interface Series
    extends Omit<DbSeries, 'scheduleValue' | 'startDate' | 'endDate'> {
    scheduleValue: ScheduleValue
    startDate: string // ISO date string
    endDate: string | null
}

// Series with tags included
export interface SeriesWithTags extends Series {
    tags: Tag[]
}

// API request types
export interface CreateSeriesRequest {
    url: string
    title?: string
    description?: string
    platform: string
    thumbnailUrl?: string
    scheduleType: ScheduleType
    scheduleValue: ScheduleValue
    startDate: string // ISO date string
    endDate?: string
    tagIds?: number[]
    totalEpisodes?: number
    watchedEpisodes?: number
}

export interface UpdateSeriesRequest {
    title?: string
    description?: string
    thumbnailUrl?: string
    scheduleType?: ScheduleType
    scheduleValue?: ScheduleValue
    startDate?: string
    endDate?: string | null
    tagIds?: number[]
    isActive?: boolean
    totalEpisodes?: number | null
    watchedEpisodes?: number
    isWatched?: boolean
}

// Progress update request
export interface UpdateProgressRequest {
    watchedEpisodes?: number
    increment?: number // Alternative: increment by this amount
}

// API response types
export interface SeriesApiResponse {
    success: boolean
    series?: SeriesWithTags
    error?: string
}

export interface SeriesListApiResponse {
    success: boolean
    series?: SeriesWithTags[]
    error?: string
}

// Filter types for listing series
export interface SeriesFilters {
    status?: 'behind' | 'caught-up' | 'backlog' | 'all'
    platform?: string
    search?: string
    isWatched?: boolean // Filter by watched tab
}

// Helper type guards
export function isDailySchedule(value: ScheduleValue): value is DailySchedule {
    return 'interval' in value && !('days' in value)
}

export function isWeeklySchedule(
    value: ScheduleValue,
): value is WeeklySchedule {
    return 'days' in value
}

export function isCustomSchedule(
    value: ScheduleValue,
): value is CustomSchedule {
    return 'interval' in value && !('days' in value)
}

export function isNoSchedule(value: ScheduleValue): value is NoSchedule {
    return (
        !('interval' in value) &&
        !('days' in value) &&
        Object.keys(value).length === 0
    )
}

// Check if a series is a backlog series (no schedule)
export function isBacklogSeries(series: Series): boolean {
    return series.scheduleType === 'none'
}

// Status display helpers - updated to include backlog
export type SeriesStatus = 'behind' | 'caught-up' | 'ended' | 'backlog'

export function getSeriesStatus(series: Series): SeriesStatus {
    // Backlog series have their own status
    if (series.scheduleType === 'none') {
        return 'backlog'
    }
    if (!series.isActive) {
        return 'ended'
    }
    if (series.missedPeriods > 0) {
        return 'behind'
    }
    return 'caught-up'
}

// Check if series is complete (all episodes watched)
export function isSeriesComplete(series: Series): boolean {
    if (series.totalEpisodes === null || series.totalEpisodes === undefined) {
        return false
    }
    return series.watchedEpisodes >= series.totalEpisodes
}

// Get progress percentage
export function getProgressPercentage(series: Series): number | null {
    if (series.totalEpisodes === null || series.totalEpisodes === undefined) {
        return null
    }
    if (series.totalEpisodes === 0) {
        return 100
    }
    return Math.min(
        100,
        Math.round((series.watchedEpisodes / series.totalEpisodes) * 100),
    )
}

// Format progress string
export function formatProgress(series: Series): string | null {
    if (
        series.watchedEpisodes === 0 &&
        (series.totalEpisodes === null || series.totalEpisodes === undefined)
    ) {
        return null
    }
    if (series.totalEpisodes === null || series.totalEpisodes === undefined) {
        return `${series.watchedEpisodes} Episodes`
    }
    return `${series.watchedEpisodes}/${series.totalEpisodes} Episodes`
}

// Default schedule value
export function getDefaultScheduleValue(type: ScheduleType): ScheduleValue {
    switch (type) {
        case 'daily':
            return { interval: 1 }
        case 'weekly':
            return { days: ['friday'] }
        case 'custom':
            return { interval: 7 }
        case 'none':
            return {}
    }
}
