import type { Series as DbSeries, Tag } from '@/lib/db/schema'

// Schedule types
export type ScheduleType = 'daily' | 'weekly' | 'custom'

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

export type ScheduleValue = DailySchedule | WeeklySchedule | CustomSchedule

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
    status?: 'behind' | 'caught-up' | 'all'
    platform?: string
    search?: string
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

// Status display helpers
export type SeriesStatus = 'behind' | 'caught-up' | 'ended'

export function getSeriesStatus(series: Series): SeriesStatus {
    if (!series.isActive) {
        return 'ended'
    }
    if (series.missedPeriods > 0) {
        return 'behind'
    }
    return 'caught-up'
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
    }
}
