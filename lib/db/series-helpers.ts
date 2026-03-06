import { eq, inArray } from 'drizzle-orm'

import { db } from '@/lib/db'
import {
    seasons,
    series,
    seriesConfig,
    seriesTags,
    tags,
} from '@/lib/db/schema'
import { ScheduleService } from '@/lib/services/schedule-service'
import type { ScheduleType, ScheduleValue, Series } from '@/types/series'

/**
 * Aggregate season episode counts for one or more series.
 *
 * For each series that `hasSeasons`, sums the per-season
 * `episodesAired`, `episodesWatched`, and `episodesRemaining` values.
 *
 * `episodesRemaining` is null only when ALL seasons have null remaining;
 * otherwise it is the sum of non-null values.
 *
 * Returns a Map keyed by seriesId.
 */
export async function aggregateSeasonCounts(seriesIds: number[]): Promise<
    Map<
        number,
        {
            episodesAired: number
            episodesWatched: number
            episodesRemaining: number | null
        }
    >
> {
    if (seriesIds.length === 0) return new Map()

    const seasonRows = await db
        .select({
            seriesId: seasons.seriesId,
            episodesAired: seasons.episodesAired,
            episodesRemaining: seasons.episodesRemaining,
            episodesWatched: seasons.episodesWatched,
        })
        .from(seasons)
        .where(inArray(seasons.seriesId, seriesIds))

    const result = new Map<
        number,
        {
            episodesAired: number
            episodesWatched: number
            episodesRemaining: number | null
        }
    >()

    for (const row of seasonRows) {
        const existing = result.get(row.seriesId) ?? {
            episodesAired: 0,
            episodesWatched: 0,
            episodesRemaining: null as number | null,
        }

        existing.episodesAired += row.episodesAired
        existing.episodesWatched += row.episodesWatched

        if (row.episodesRemaining !== null) {
            existing.episodesRemaining =
                (existing.episodesRemaining ?? 0) + row.episodesRemaining
        }

        result.set(row.seriesId, existing)
    }

    return result
}

/** Default config values for multi-season series (no series_config row). */
const MULTI_SEASON_CONFIG_DEFAULTS: Omit<
    Series,
    keyof typeof series.$inferSelect | 'tags'
> = {
    scheduleType: 'none' as ScheduleType,
    scheduleValue: {} as ScheduleValue,
    startDate: new Date().toISOString(),
    endDate: null,
    lastWatchedAt: null,
    nextEpisodeAt: new Date(0),
    isActive: true,
    episodesAired: 0,
    episodesRemaining: null,
    episodesWatched: 0,
}

/**
 * Build a flattened Series object from a series row + optional config row.
 *
 * For single-mode (hasSeasons=false): merges series metadata + series_config.
 * For multi-season (hasSeasons=true): uses defaults, then overlays season aggregation.
 */
function flattenSeriesRow(
    s: typeof series.$inferSelect,
    config: typeof seriesConfig.$inferSelect | null,
    seasonAggregation?: {
        episodesAired: number
        episodesWatched: number
        episodesRemaining: number | null
    } | null,
): Omit<Series, 'tags'> {
    if (config) {
        // Single-mode: use series_config
        return {
            ...s,
            scheduleType: config.scheduleType as ScheduleType,
            scheduleValue: ScheduleService.parseScheduleValue(
                config.scheduleType as ScheduleType,
                config.scheduleValue,
            ),
            startDate:
                config.startDate?.toISOString() ?? new Date().toISOString(),
            endDate: config.endDate?.toISOString() ?? null,
            lastWatchedAt: config.lastWatchedAt,
            nextEpisodeAt: config.nextEpisodeAt,
            isActive: config.isActive,
            episodesAired: config.episodesAired,
            episodesRemaining: config.episodesRemaining,
            episodesWatched: config.episodesWatched,
        }
    }

    // Multi-season: use defaults, overlay aggregated episode counts
    return {
        ...s,
        ...MULTI_SEASON_CONFIG_DEFAULTS,
        ...(seasonAggregation && {
            episodesAired: seasonAggregation.episodesAired,
            episodesWatched: seasonAggregation.episodesWatched,
            episodesRemaining: seasonAggregation.episodesRemaining,
        }),
    }
}

/**
 * Fetch a single series with its tags (and config / season aggregation).
 * @param seriesId - The ID of the series to fetch
 * @returns The flattened series with tags, or null if not found
 */
export async function fetchSeriesWithTags(seriesId: number) {
    // Fetch series + LEFT JOIN series_config
    const rows = await db
        .select({
            series: series,
            config: seriesConfig,
        })
        .from(series)
        .leftJoin(seriesConfig, eq(series.id, seriesConfig.seriesId))
        .where(eq(series.id, seriesId))
        .limit(1)

    if (rows.length === 0) {
        return null
    }

    const { series: s, config } = rows[0]

    // Fetch tags for this series
    const tagsResult = await db
        .select({
            tagId: tags.id,
            tagName: tags.name,
            tagColor: tags.color,
        })
        .from(seriesTags)
        .innerJoin(tags, eq(seriesTags.tagId, tags.id))
        .where(eq(seriesTags.seriesId, seriesId))

    const parsedTags = tagsResult.map((t) => ({
        id: t.tagId,
        name: t.tagName,
        color: t.tagColor,
    }))

    // Aggregate season counts if series has seasons
    let seasonAggregation: {
        episodesAired: number
        episodesWatched: number
        episodesRemaining: number | null
    } | null = null

    if (s.hasSeasons) {
        const aggregated = await aggregateSeasonCounts([s.id])
        seasonAggregation = aggregated.get(s.id) ?? null
    }

    return {
        ...flattenSeriesRow(s, config, seasonAggregation),
        tags: parsedTags,
    }
}

/**
 * Fetch multiple series with their configs (for list queries).
 * Returns a Map of seriesId → flattened series data (no tags).
 */
export async function fetchSeriesWithConfigs(seriesIds: number[]) {
    if (seriesIds.length === 0) return new Map<number, Omit<Series, 'tags'>>()

    const rows = await db
        .select({
            series: series,
            config: seriesConfig,
        })
        .from(series)
        .leftJoin(seriesConfig, eq(series.id, seriesConfig.seriesId))
        .where(inArray(series.id, seriesIds))

    // Aggregate season counts for multi-season series
    const multiSeasonIds = rows
        .filter((r) => r.series.hasSeasons)
        .map((r) => r.series.id)
    const seasonAggs = await aggregateSeasonCounts(multiSeasonIds)

    const result = new Map<number, Omit<Series, 'tags'>>()
    for (const { series: s, config } of rows) {
        const agg = s.hasSeasons ? (seasonAggs.get(s.id) ?? null) : null
        result.set(s.id, flattenSeriesRow(s, config, agg))
    }
    return result
}
