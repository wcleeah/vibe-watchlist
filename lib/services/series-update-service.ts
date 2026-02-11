import { and, eq, lte, sql } from 'drizzle-orm'

import { db } from '@/lib/db'
import { series, userConfig } from '@/lib/db/schema'
import { ScheduleService } from '@/lib/services/schedule-service'
import { getEndOfHKTDay, isHKTAfter, nowHKT, toHKT } from '@/lib/utils/hkt-date'
import type { ScheduleType, ScheduleValue } from '@/types/series'

export interface SeriesUpdateResult {
    processed: number
    updated: number
    deactivated: number
    errors: number
}

export class SeriesUpdateService {
    /**
     * Updates all active series schedules
     * This method can be called from:
     * - Trigger.dev scheduled tasks
     * - Manual API endpoints
     * - Admin dashboard actions
     */
    static async updateSeriesSchedules(): Promise<SeriesUpdateResult> {
        console.log('SeriesUpdateService: Starting series schedule update')

        const timezone = await SeriesUpdateService.getTimezone()
        const now = nowHKT()

        // Query series where nextEpisodeAt is due (in HKT)
        // Use SQL to ensure proper timezone comparison at the database level
        const activeSeries = await db
            .select()
            .from(series)
            .where(
                and(
                    eq(series.isActive, true),
                    sql`${series.nextEpisodeAt} <= ${now}`,
                ),
            )

        console.log(
            `SeriesUpdateService: Found ${activeSeries.length} series to update`,
        )

        let updatedCount = 0
        let deactivatedCount = 0
        let errorCount = 0

        for (const s of activeSeries) {
            try {
                const scheduleType = s.scheduleType as ScheduleType

                // Skip backlog series - they don't have schedules to update
                if (scheduleType === 'none') {
                    console.log(
                        `SeriesUpdateService: Skipping backlog series ${s.id}`,
                    )
                    continue
                }

                const scheduleValue = ScheduleService.parseScheduleValue(
                    scheduleType,
                    s.scheduleValue,
                )

                const missedPeriods = ScheduleService.calculateMissedPeriods(
                    s.nextEpisodeAt,
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
                    s.endDate && isHKTAfter(now, getEndOfHKTDay(s.endDate))

                // Calculate new total episodes if auto-advance is enabled
                let newTotalEpisodes = s.totalEpisodes
                if (s.autoAdvanceTotalEpisodes && missedPeriods > 0) {
                    // If totalEpisodes is null/undefined, treat as 0
                    const currentTotal = s.totalEpisodes ?? 0
                    newTotalEpisodes = currentTotal + missedPeriods
                }

                await db
                    .update(series)
                    .set({
                        missedPeriods: s.missedPeriods + missedPeriods,
                        nextEpisodeAt,
                        isActive: !hasEnded,
                        updatedAt: now,
                        ...(s.autoAdvanceTotalEpisodes && missedPeriods > 0
                            ? { totalEpisodes: newTotalEpisodes }
                            : {}),
                    })
                    .where(eq(series.id, s.id))

                if (hasEnded) {
                    deactivatedCount++
                    console.log(
                        `SeriesUpdateService: Deactivated series ${s.id} (ended)`,
                    )
                } else {
                    updatedCount++
                }
            } catch (error) {
                errorCount++
                console.error(
                    `SeriesUpdateService: Error updating series ${s.id}:`,
                    error,
                )
            }
        }

        console.log(
            `SeriesUpdateService: Completed. Updated: ${updatedCount}, Deactivated: ${deactivatedCount}, Errors: ${errorCount}`,
        )

        return {
            processed: activeSeries.length,
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
