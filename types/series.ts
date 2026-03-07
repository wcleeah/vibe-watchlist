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
    time?: string // HKT time string e.g. '21:00'
}

export interface WeeklySchedule {
    days: DayOfWeek[]
    time?: string // HKT time string e.g. '21:00'
}

export interface CustomSchedule {
    interval: number
    time?: string // HKT time string e.g. '21:00'
}

// Schedule entry for specific date with episode count
export interface DateScheduleEntry {
    date: string // ISO date string (YYYY-MM-DD)
    episodes: number // Number of episodes releasing on this date
}

// Schedule with multiple specific dates
export interface DatesSchedule {
    entries: DateScheduleEntry[]
    time?: string // HKT time string e.g. '21:00'
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

// ============================================================
// Config fields — shared shape for series_config rows & season rows
// These fields exist on series_config (single-mode) or are
// aggregated from seasons (multi-season mode).
// ============================================================

/** The schedule/episode fields that live on series_config or seasons. */
export interface SeriesConfigFields {
    scheduleType: ScheduleType
    scheduleValue: ScheduleValue
    startDate: string // ISO date string
    endDate: string | null
    lastWatchedAt: Date | null
    nextEpisodeAt: Date
    isActive: boolean
    episodesAired: number
    episodesRemaining: number | null
    episodesWatched: number
}

/**
 * Flattened Series type — combines DB metadata with config fields.
 *
 * For single-mode (hasSeasons=false): config comes from `series_config`.
 * For multi-season (hasSeasons=true): config is aggregated from seasons
 * at the DB-helper layer, so consumers always see a flat shape.
 */
export interface Series extends DbSeries, SeriesConfigFields {}

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

// ============================================================
// Computed episode fields (enriched types)
// ============================================================

export interface EpisodeComputedFields {
    episodesTotal: number
    episodesUnwatched: number
    episodesBehind: number
}

export interface SeriesEnriched extends Series, EpisodeComputedFields {}
export interface SeriesWithTagsEnriched
    extends SeriesWithTags,
        EpisodeComputedFields {}
export interface SeasonEnriched extends Season, EpisodeComputedFields {}

/**
 * Compute derived episode fields from the stored DB fields.
 */
export function computeEpisodeFields(entity: {
    episodesAired: number
    episodesRemaining: number | null
    episodesWatched: number
}): EpisodeComputedFields {
    const episodesTotal = entity.episodesAired + (entity.episodesRemaining ?? 0)
    const episodesUnwatched = episodesTotal - entity.episodesWatched
    const episodesBehind = entity.episodesAired - entity.episodesWatched
    return { episodesTotal, episodesUnwatched, episodesBehind }
}

/**
 * Enrich a series with computed episode fields.
 */
export function enrichSeries<T extends Series>(
    s: T,
): T & EpisodeComputedFields {
    return { ...s, ...computeEpisodeFields(s) }
}

/**
 * Enrich a season with computed episode fields.
 */
export function enrichSeason<T extends Season>(
    s: T,
): T & EpisodeComputedFields {
    return { ...s, ...computeEpisodeFields(s) }
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

// ============================================================
// API request types
// ============================================================

export interface CreateSeriesRequest {
    url: string
    title?: string
    platform: string
    thumbnailUrl?: string
    scheduleType?: ScheduleType
    scheduleValue?: ScheduleValue
    startDate?: string // ISO date string
    endDate?: string | null
    tagIds?: number[]
    episodesAired?: number
    episodesRemaining?: number
    episodesWatched?: number
    hasSeasons?: boolean
    seasons?: BulkSeasonData[]
}

export interface UpdateSeriesRequest {
    title?: string
    thumbnailUrl?: string
    scheduleType?: ScheduleType
    scheduleValue?: ScheduleValue
    startDate?: string
    endDate?: string | null
    tagIds?: number[]
    isActive?: boolean
    episodesAired?: number
    episodesRemaining?: number | null
    episodesWatched?: number
    isWatched?: boolean
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
    episodesAired?: number
    episodesRemaining?: number | null
    episodesWatched?: number
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
    episodesAired?: number
    episodesRemaining?: number
    episodesWatched?: number
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
    episodesAired?: number
    episodesRemaining?: number | null
    episodesWatched?: number
    isWatched?: boolean
}

// Progress update request
export interface UpdateProgressRequest {
    episodesWatched?: number
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
    sortBy?: 'custom' | 'episodesBehind' | 'createdAt' | 'title'
    sortOrder?: 'asc' | 'desc'
}

// ============================================================
// Helper type guards
// ============================================================

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

// ============================================================
// Status helpers
// ============================================================

// A series/season can have multiple statuses simultaneously
export type SeriesStatus = 'behind' | 'caught-up' | 'ended' | 'backlog'

/**
 * Get all applicable statuses for a series.
 * A series can be both 'ended' AND 'behind' if it ended with unwatched episodes.
 */
export function getSeriesStatuses(
    series: Series | SeriesEnriched,
): SeriesStatus[] {
    if (series.scheduleType === 'none') {
        return ['backlog']
    }

    const { episodesBehind } =
        'episodesBehind' in series ? series : computeEpisodeFields(series)

    const statuses: SeriesStatus[] = []

    if (!series.isActive) {
        statuses.push('ended')
    }

    if (episodesBehind > 0) {
        statuses.push('behind')
    }

    if (statuses.length === 0) {
        statuses.push('caught-up')
    }

    return statuses
}

/**
 * Get the primary status for a series (for filtering/sorting).
 * Backward-compatible single-status accessor.
 */
export function getSeriesStatus(series: Series | SeriesEnriched): SeriesStatus {
    const statuses = getSeriesStatuses(series)
    // 'behind' takes priority for filtering purposes
    if (statuses.includes('behind')) return 'behind'
    return statuses[0]
}

/**
 * Get all applicable statuses for a season.
 */
export function getSeasonStatuses(
    season: Season | SeasonEnriched,
): SeriesStatus[] {
    if (season.scheduleType === 'none') {
        return ['backlog']
    }

    const { episodesBehind } =
        'episodesBehind' in season ? season : computeEpisodeFields(season)

    const statuses: SeriesStatus[] = []

    if (!season.isActive) {
        statuses.push('ended')
    }

    if (episodesBehind > 0) {
        statuses.push('behind')
    }

    if (statuses.length === 0) {
        statuses.push('caught-up')
    }

    return statuses
}

/**
 * Get the primary status for a season.
 */
export function getSeasonStatus(season: Season | SeasonEnriched): SeriesStatus {
    const statuses = getSeasonStatuses(season)
    if (statuses.includes('behind')) return 'behind'
    return statuses[0]
}

// Check if a series is a backlog season (no schedule)
export function isBacklogSeason(season: Season): boolean {
    return season.scheduleType === 'none'
}

// ============================================================
// Progress helpers
// ============================================================

/**
 * Check if series is complete (all episodes watched)
 */
export function isSeriesComplete(series: Series | SeriesEnriched): boolean {
    const { episodesTotal } =
        'episodesTotal' in series ? series : computeEpisodeFields(series)
    if (episodesTotal === 0 && series.episodesRemaining === null) {
        return false // unknown total
    }
    return series.episodesWatched >= episodesTotal
}

/**
 * Get progress percentage
 */
export function getProgressPercentage(
    series: Series | SeriesEnriched,
): number | null {
    const { episodesTotal } =
        'episodesTotal' in series ? series : computeEpisodeFields(series)
    if (episodesTotal === 0 && series.episodesRemaining === null) {
        return null // unknown total
    }
    if (episodesTotal === 0) {
        return 100
    }
    return Math.min(
        100,
        Math.round((series.episodesWatched / episodesTotal) * 100),
    )
}

/**
 * Format progress string
 */
export function formatProgress(series: Series | SeriesEnriched): string | null {
    const { episodesTotal } =
        'episodesTotal' in series ? series : computeEpisodeFields(series)
    if (
        series.episodesWatched === 0 &&
        series.episodesAired === 0 &&
        series.episodesRemaining === null
    ) {
        return null
    }
    if (series.episodesRemaining === null) {
        // No known total — show watched vs aired
        return `${series.episodesWatched}/${series.episodesAired} Episodes`
    }
    return `${series.episodesWatched}/${episodesTotal} Episodes`
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

// ============================================================
// Season helpers
// ============================================================

/**
 * Check if a season is complete (all episodes watched)
 */
export function isSeasonComplete(season: Season | SeasonEnriched): boolean {
    const { episodesTotal } =
        'episodesTotal' in season ? season : computeEpisodeFields(season)
    if (episodesTotal === 0 && season.episodesRemaining === null) {
        return false
    }
    return season.episodesWatched >= episodesTotal
}

/**
 * Get season progress percentage
 */
export function getSeasonProgressPercentage(
    season: Season | SeasonEnriched,
): number | null {
    const { episodesTotal } =
        'episodesTotal' in season ? season : computeEpisodeFields(season)
    if (episodesTotal === 0 && season.episodesRemaining === null) {
        return null
    }
    if (episodesTotal === 0) {
        return 100
    }
    return Math.min(
        100,
        Math.round((season.episodesWatched / episodesTotal) * 100),
    )
}

/**
 * Format season progress string
 */
export function formatSeasonProgress(
    season: Season | SeasonEnriched,
): string | null {
    const { episodesTotal } =
        'episodesTotal' in season ? season : computeEpisodeFields(season)
    if (
        season.episodesWatched === 0 &&
        season.episodesAired === 0 &&
        season.episodesRemaining === null
    ) {
        return null
    }
    if (season.episodesRemaining === null) {
        return `${season.episodesWatched}/${season.episodesAired} Aired`
    }
    return `${season.episodesWatched}/${episodesTotal} Episodes`
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
    episodesWatched: number
    episodesAired: number
    episodesRemaining: number | null
    episodesTotal: number
} {
    let watched = 0
    let aired = 0
    let remaining = 0
    let hasRemaining = false

    for (const season of seasons) {
        watched += season.episodesWatched
        aired += season.episodesAired
        if (season.episodesRemaining !== null) {
            remaining += season.episodesRemaining
            hasRemaining = true
        }
    }

    return {
        episodesWatched: watched,
        episodesAired: aired,
        episodesRemaining: hasRemaining ? remaining : null,
        episodesTotal: aired + (hasRemaining ? remaining : 0),
    }
}
