import { eq, inArray } from 'drizzle-orm'

import { db } from '@/lib/db'
import { seasons, series, seriesTags, tags } from '@/lib/db/schema'
import { ScheduleService } from '@/lib/services/schedule-service'
import type { ScheduleType } from '@/types/series'

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

/**
 * Fetch a single series with its tags
 * @param seriesId - The ID of the series to fetch
 * @returns The series with tags, or null if not found
 */
export async function fetchSeriesWithTags(seriesId: number) {
    // Fetch series
    const seriesResult = await db
        .select({
            id: series.id,
            url: series.url,
            title: series.title,
            platform: series.platform,
            thumbnailUrl: series.thumbnailUrl,
            scheduleType: series.scheduleType,
            scheduleValue: series.scheduleValue,
            startDate: series.startDate,
            endDate: series.endDate,
            lastWatchedAt: series.lastWatchedAt,
            nextEpisodeAt: series.nextEpisodeAt,
            isActive: series.isActive,
            episodesAired: series.episodesAired,
            episodesRemaining: series.episodesRemaining,
            episodesWatched: series.episodesWatched,
            isWatched: series.isWatched,
            hasSeasons: series.hasSeasons,
            sortOrder: series.sortOrder,
            createdAt: series.createdAt,
            updatedAt: series.updatedAt,
        })
        .from(series)
        .where(eq(series.id, seriesId))
        .limit(1)

    if (seriesResult.length === 0) {
        return null
    }

    const s = seriesResult[0]

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
    let episodeOverrides: {
        episodesAired: number
        episodesWatched: number
        episodesRemaining: number | null
    } | null = null

    if (s.hasSeasons) {
        const aggregated = await aggregateSeasonCounts([s.id])
        episodeOverrides = aggregated.get(s.id) ?? null
    }

    return {
        ...s,
        ...(episodeOverrides && {
            episodesAired: episodeOverrides.episodesAired,
            episodesWatched: episodeOverrides.episodesWatched,
            episodesRemaining: episodeOverrides.episodesRemaining,
        }),
        scheduleValue: ScheduleService.parseScheduleValue(
            s.scheduleType as ScheduleType,
            s.scheduleValue,
        ),
        tags: parsedTags,
    }
}
