import type {
    Season as DbSeason,
    Series as DbSeries,
    Tag,
} from '@/lib/db/schema'

// Schedule types - 'none' is for backlog series without a schedule
// 'dates' allows specifying multiple absolute dates with episode counts
export type ScheduleType = 'daily' | 'weekly' | 'custom' | 'dates' | 'none'

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

// Schedule entry for specific date with episode count
export interface DateScheduleEntry {
    date: string // ISO date string (YYYY-MM-DD)
    episodes: number // Number of episodes releasing on this date
}

// Schedule with multiple specific dates
export interface DatesSchedule {
    entries: DateScheduleEntry[]
}

// Empty schedule for backlog series
export type NoSchedule = Record<string, never>

export type ScheduleValue =
    | DailySchedule
    | WeeklySchedule
    | CustomSchedule
    | DatesSchedule
    | NoSchedule

// Content mode for the add form
export type ContentMode = 'video' | 'series' | 'playlist' | 'coming-soon'

// Series with typed schedule value
export interface Series
    extends Omit<DbSeries, 'scheduleValue' | 'startDate' | 'endDate'> {
    scheduleValue: ScheduleValue
    startDate: string // ISO date string
    endDate: string | null
    autoAdvanceTotalEpisodes: boolean
    hasSeasons: boolean
}

// Series with tags included
export interface SeriesWithTags extends Series {
    tags: Tag[]
}

// Season with typed schedule value
export interface Season
    extends Omit<DbSeason, 'scheduleValue' | 'startDate' | 'endDate'> {
    scheduleValue: ScheduleValue
    startDate: string // ISO date string
    endDate: string | null
}

// Series with tags and seasons included
export interface SeriesWithSeasonsAndTags extends SeriesWithTags {
    seasons: Season[]
}

// Status summary for multi-season series
export interface SeriesStatusSummary {
    behind: number
    caughtUp: number
    ended: number
    backlog: number
    total: number
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
    autoAdvanceTotalEpisodes?: boolean
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
    missedPeriods?: number
    autoAdvanceTotalEpisodes?: boolean
    hasSeasons?: boolean
    /** Full seasons array — server diffs against DB (create/update/delete) */
    seasons?: BulkSeasonData[]
}

/** Season data for bulk save via series PUT endpoint */
export interface BulkSeasonData {
    /** Present for existing seasons, absent for new ones */
    id?: number
    seasonNumber: number
    title?: string
    url?: string
    scheduleType: ScheduleType
    scheduleValue: ScheduleValue
    startDate: string
    endDate?: string | null
    isActive?: boolean
    totalEpisodes?: number | null
    watchedEpisodes?: number
    missedPeriods?: number
    autoAdvanceTotalEpisodes?: boolean
}

// Season API request types
export interface CreateSeasonRequest {
    seasonNumber: number
    title?: string
    url?: string
    scheduleType: ScheduleType
    scheduleValue: ScheduleValue
    startDate: string
    endDate?: string
    totalEpisodes?: number
    watchedEpisodes?: number
    autoAdvanceTotalEpisodes?: boolean
}

export interface UpdateSeasonRequest {
    seasonNumber?: number
    title?: string
    url?: string | null
    scheduleType?: ScheduleType
    scheduleValue?: ScheduleValue
    startDate?: string
    endDate?: string | null
    isActive?: boolean
    totalEpisodes?: number | null
    watchedEpisodes?: number
    isWatched?: boolean
    missedPeriods?: number
    autoAdvanceTotalEpisodes?: boolean
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

export interface SeasonApiResponse {
    success: boolean
    season?: Season
    error?: string
}

export interface SeasonListApiResponse {
    success: boolean
    seasons?: Season[]
    error?: string
}

// Filter types for listing series
export interface SeriesFilters {
    status?: 'behind' | 'caught-up' | 'backlog' | 'all'
    platform?: string
    search?: string
    isWatched?: boolean // Filter by watched tab
    sortBy?: 'custom' | 'missedPeriods' | 'createdAt' | 'title'
    sortOrder?: 'asc' | 'desc'
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
        !('entries' in value) &&
        Object.keys(value).length === 0
    )
}

export function isDatesSchedule(value: ScheduleValue): value is DatesSchedule {
    return 'entries' in value
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
        case 'dates':
            return { entries: [] }
        case 'none':
            return {}
    }
}

// Season helpers

/**
 * Get the status of a season (same logic as series)
 */
export function getSeasonStatus(season: Season): SeriesStatus {
    if (season.scheduleType === 'none') {
        return 'backlog'
    }
    if (!season.isActive) {
        return 'ended'
    }
    if (season.missedPeriods > 0) {
        return 'behind'
    }
    return 'caught-up'
}

/**
 * Check if a season is a backlog season (no schedule)
 */
export function isBacklogSeason(season: Season): boolean {
    return season.scheduleType === 'none'
}

/**
 * Check if a season is complete (all episodes watched)
 */
export function isSeasonComplete(season: Season): boolean {
    if (season.totalEpisodes === null || season.totalEpisodes === undefined) {
        return false
    }
    return season.watchedEpisodes >= season.totalEpisodes
}

/**
 * Get season progress percentage
 */
export function getSeasonProgressPercentage(season: Season): number | null {
    if (season.totalEpisodes === null || season.totalEpisodes === undefined) {
        return null
    }
    if (season.totalEpisodes === 0) {
        return 100
    }
    return Math.min(
        100,
        Math.round((season.watchedEpisodes / season.totalEpisodes) * 100),
    )
}

/**
 * Format season progress string
 */
export function formatSeasonProgress(season: Season): string | null {
    if (
        season.watchedEpisodes === 0 &&
        (season.totalEpisodes === null || season.totalEpisodes === undefined)
    ) {
        return null
    }
    if (season.totalEpisodes === null || season.totalEpisodes === undefined) {
        return `${season.watchedEpisodes} Episodes`
    }
    return `${season.watchedEpisodes}/${season.totalEpisodes} Episodes`
}

/**
 * Get the display title for a season
 */
export function getSeasonDisplayTitle(season: Season): string {
    if (season.title) {
        return `Season ${season.seasonNumber}: ${season.title}`
    }
    return `Season ${season.seasonNumber}`
}

/**
 * Compute a multi-status summary for a series with seasons
 */
export function getSeriesStatusSummary(seasons: Season[]): SeriesStatusSummary {
    const summary: SeriesStatusSummary = {
        behind: 0,
        caughtUp: 0,
        ended: 0,
        backlog: 0,
        total: seasons.length,
    }

    for (const season of seasons) {
        const status = getSeasonStatus(season)
        switch (status) {
            case 'behind':
                summary.behind++
                break
            case 'caught-up':
                summary.caughtUp++
                break
            case 'ended':
                summary.ended++
                break
            case 'backlog':
                summary.backlog++
                break
        }
    }

    return summary
}

/**
 * Format status summary for display
 */
export function formatStatusSummary(summary: SeriesStatusSummary): string {
    const parts: string[] = []
    if (summary.behind > 0) parts.push(`${summary.behind} behind`)
    if (summary.caughtUp > 0) parts.push(`${summary.caughtUp} caught up`)
    if (summary.ended > 0) parts.push(`${summary.ended} ended`)
    if (summary.backlog > 0) parts.push(`${summary.backlog} backlog`)
    return parts.join(', ') || 'No seasons'
}

/**
 * Compute aggregate episode progress across all seasons
 */
export function getAggregateProgress(seasons: Season[]): {
    watchedEpisodes: number
    totalEpisodes: number | null
} {
    let watched = 0
    let total = 0
    let hasTotal = false

    for (const season of seasons) {
        watched += season.watchedEpisodes
        if (
            season.totalEpisodes !== null &&
            season.totalEpisodes !== undefined
        ) {
            total += season.totalEpisodes
            hasTotal = true
        }
    }

    return {
        watchedEpisodes: watched,
        totalEpisodes: hasTotal ? total : null,
    }
}
