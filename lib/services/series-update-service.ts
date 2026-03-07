import { and, eq, sql } from 'drizzle-orm'

import { db } from '@/lib/db'
import { seasons, series, seriesConfig, userConfig } from '@/lib/db/schema'
import { ScheduleService } from '@/lib/services/schedule-service'
import { getEndOfHKTDay, isHKTAfter, nowHKT, toHKT } from '@/lib/utils/hkt-date'
import type { ScheduleType, ScheduleValue } from '@/types/series'

export interface SeriesUpdateResult {
    processed: number
    updated: number
    deactivated: number
    errors: number
    seasonsProcessed: number
    seasonsUpdated: number
    seasonsDeactivated: number
    seasonsErrors: number
    totalProcessed: number
    totalUpdated: number
    totalDeactivated: number
    totalErrors: number
}

export class SeriesUpdateService {
    /**
     * Updates all active series and season schedules.
     * Increments episodesAired and decrements episodesRemaining
     * for each new episode period that has passed.
     */
    static async updateSeriesSchedules(): Promise<SeriesUpdateResult> {
        console.log('SeriesUpdateService: Starting series schedule update')

        const timezone = await SeriesUpdateService.getTimezone()
        const now = nowHKT()

        // 1. Update standalone series (hasSeasons=false) via series_config
        const standaloneResult =
            await SeriesUpdateService.updateStandaloneSeries(now, timezone)

        // 2. Update active seasons
        const seasonResult = await SeriesUpdateService.updateActiveSeasons(
            now,
            timezone,
        )

        console.log(
            `SeriesUpdateService: Completed. Series — Updated: ${standaloneResult.updated}, Deactivated: ${standaloneResult.deactivated}, Errors: ${standaloneResult.errors}. Seasons — Updated: ${seasonResult.updated}, Deactivated: ${seasonResult.deactivated}, Errors: ${seasonResult.errors}`,
        )

        const totalProcessed =
            standaloneResult.processed + seasonResult.processed
        const totalUpdated = standaloneResult.updated + seasonResult.updated
        const totalDeactivated =
            standaloneResult.deactivated + seasonResult.deactivated
        const totalErrors = standaloneResult.errors + seasonResult.errors

        return {
            processed: standaloneResult.processed,
            updated: standaloneResult.updated,
            deactivated: standaloneResult.deactivated,
            errors: standaloneResult.errors,
            seasonsProcessed: seasonResult.processed,
            seasonsUpdated: seasonResult.updated,
            seasonsDeactivated: seasonResult.deactivated,
            seasonsErrors: seasonResult.errors,
            totalProcessed,
            totalUpdated,
            totalDeactivated,
            totalErrors,
        }
    }

    /**
     * Update standalone series (hasSeasons=false) that have due episodes.
     * Schedule/episode data now lives on series_config, not on series.
     */
    private static async updateStandaloneSeries(
        now: Date,
        timezone: string,
    ): Promise<{
        processed: number
        updated: number
        deactivated: number
        errors: number
    }> {
        // Query active series_config rows where nextEpisodeAt is due,
        // joined with series to filter hasSeasons=false
        const activeConfigs = await db
            .select({
                config: seriesConfig,
                seriesId: series.id,
            })
            .from(seriesConfig)
            .innerJoin(series, eq(seriesConfig.seriesId, series.id))
            .where(
                and(
                    eq(seriesConfig.isActive, true),
                    eq(series.hasSeasons, false),
                    sql`${seriesConfig.nextEpisodeAt} <= ${now}`,
                ),
            )

        console.log(
            `SeriesUpdateService: Found ${activeConfigs.length} standalone series to update`,
        )

        let updatedCount = 0
        let deactivatedCount = 0
        let errorCount = 0

        for (const row of activeConfigs) {
            const config = row.config
            try {
                const scheduleType = config.scheduleType as ScheduleType

                // Skip backlog series - they don't have schedules to update
                if (scheduleType === 'none') {
                    console.log(
                        `SeriesUpdateService: Skipping backlog series config ${config.id} (series ${config.seriesId})`,
                    )
                    continue
                }

                const scheduleValue = ScheduleService.parseScheduleValue(
                    scheduleType,
                    config.scheduleValue,
                )

                // Count how many new episodes have aired since last update
                const newEpisodes =
                    ScheduleService.calculateNewEpisodesSinceDate(
                        config.nextEpisodeAt,
                        now,
                        scheduleType,
                        scheduleValue as ScheduleValue,
                        timezone,
                    )

                // Calculate next episode date (ensuring it's in the future in HKT)
                let nextEpisodeAt = toHKT(now)
                do {
                    nextEpisodeAt = ScheduleService.calculateNextEpisodeDate(
                        scheduleType,
                        scheduleValue as ScheduleValue,
                        nextEpisodeAt,
                        timezone,
                    )
                    nextEpisodeAt = toHKT(nextEpisodeAt)
                } while (nextEpisodeAt.getTime() <= now.getTime())

                // Check if series has ended (current HKT time is past end of endDate day)
                const hasEnded =
                    config.endDate &&
                    isHKTAfter(now, getEndOfHKTDay(config.endDate))

                // Increment episodesAired, decrement episodesRemaining
                const newAired = config.episodesAired + newEpisodes
                const newRemaining =
                    config.episodesRemaining !== null
                        ? Math.max(0, config.episodesRemaining - newEpisodes)
                        : null

                // Update series_config (schedule/episode data)
                await db
                    .update(seriesConfig)
                    .set({
                        episodesAired: newAired,
                        ...(newRemaining !== null
                            ? { episodesRemaining: newRemaining }
                            : {}),
                        nextEpisodeAt,
                        isActive: !hasEnded,
                        updatedAt: now,
                    })
                    .where(eq(seriesConfig.id, config.id))

                // Also update series.updatedAt
                await db
                    .update(series)
                    .set({ updatedAt: now })
                    .where(eq(series.id, config.seriesId))

                if (hasEnded) {
                    deactivatedCount++
                    console.log(
                        `SeriesUpdateService: Deactivated series config ${config.id} (series ${config.seriesId}, ended)`,
                    )
                } else {
                    updatedCount++
                }
            } catch (error) {
                errorCount++
                console.error(
                    `SeriesUpdateService: Error updating series config ${config.id} (series ${config.seriesId}):`,
                    error,
                )
            }
        }

        return {
            processed: activeConfigs.length,
            updated: updatedCount,
            deactivated: deactivatedCount,
            errors: errorCount,
        }
    }

    /**
     * Update active seasons that have due episodes
     */
    private static async updateActiveSeasons(
        now: Date,
        timezone: string,
    ): Promise<{
        processed: number
        updated: number
        deactivated: number
        errors: number
    }> {
        // Query active seasons where nextEpisodeAt is due
        const activeSeasons = await db
            .select()
            .from(seasons)
            .where(
                and(
                    eq(seasons.isActive, true),
                    sql`${seasons.nextEpisodeAt} <= ${now}`,
                ),
            )

        console.log(
            `SeriesUpdateService: Found ${activeSeasons.length} seasons to update`,
        )

        let updatedCount = 0
        let deactivatedCount = 0
        let errorCount = 0

        for (const s of activeSeasons) {
            try {
                const scheduleType = s.scheduleType as ScheduleType

                // Skip backlog seasons
                if (scheduleType === 'none') {
                    continue
                }

                const scheduleValue = ScheduleService.parseScheduleValue(
                    scheduleType,
                    s.scheduleValue,
                )

                // Count how many new episodes have aired since last update
                const newEpisodes =
                    ScheduleService.calculateNewEpisodesSinceDate(
                        s.nextEpisodeAt,
                        now,
                        scheduleType,
                        scheduleValue as ScheduleValue,
                        timezone,
                    )

                // Calculate next episode date (ensuring it's in the future)
                let nextEpisodeAt = toHKT(now)
                do {
                    nextEpisodeAt = ScheduleService.calculateNextEpisodeDate(
                        scheduleType,
                        scheduleValue as ScheduleValue,
                        nextEpisodeAt,
                        timezone,
                    )
                    nextEpisodeAt = toHKT(nextEpisodeAt)
                } while (nextEpisodeAt.getTime() <= now.getTime())

                // Check if season has ended
                const hasEnded =
                    s.endDate && isHKTAfter(now, getEndOfHKTDay(s.endDate))

                // Increment episodesAired, decrement episodesRemaining
                const newAired = s.episodesAired + newEpisodes
                const newRemaining =
                    s.episodesRemaining !== null
                        ? Math.max(0, s.episodesRemaining - newEpisodes)
                        : null

                await db
                    .update(seasons)
                    .set({
                        episodesAired: newAired,
                        ...(newRemaining !== null
                            ? { episodesRemaining: newRemaining }
                            : {}),
                        nextEpisodeAt,
                        isActive: !hasEnded,
                        updatedAt: now,
                    })
                    .where(eq(seasons.id, s.id))

                if (hasEnded) {
                    deactivatedCount++
                    console.log(
                        `SeriesUpdateService: Deactivated season ${s.id} (series ${s.seriesId}, ended)`,
                    )
                } else {
                    updatedCount++
                }
            } catch (error) {
                errorCount++
                console.error(
                    `SeriesUpdateService: Error updating season ${s.id}:`,
                    error,
                )
            }
        }

        return {
            processed: activeSeasons.length,
            updated: updatedCount,
            deactivated: deactivatedCount,
            errors: errorCount,
        }
    }

    /**
     * Get the configured timezone from user config
     * Defaults to Asia/Hong_Kong
     */
    private static async getTimezone(): Promise<string> {
        let timezone = 'Asia/Hong_Kong'

        try {
            const timezoneConfig = await db
                .select()
                .from(userConfig)
                .where(eq(userConfig.configKey, 'timezone'))
                .limit(1)

            if (timezoneConfig.length > 0) {
                const configValue = timezoneConfig[0].configValue as {
                    timezone?: string
                }
                if (configValue?.timezone) {
                    timezone = configValue.timezone
                }
            }
        } catch {
            console.warn(
                'SeriesUpdateService: Could not fetch timezone config, using default',
            )
        }

        return timezone
    }
}
