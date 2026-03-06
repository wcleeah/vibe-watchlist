import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { series, seriesTags, tags } from '@/lib/db/schema'
import { ScheduleService } from '@/lib/services/schedule-service'
import type { ScheduleType } from '@/types/series'

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

    return {
        ...s,
        scheduleValue: ScheduleService.parseScheduleValue(
            s.scheduleType as ScheduleType,
            s.scheduleValue,
        ),
        tags: parsedTags,
    }
}
