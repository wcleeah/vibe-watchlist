import { and, eq, lte } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { series, userConfig } from '@/lib/db/schema'
import { ScheduleService } from '@/lib/services/schedule-service'
import type { ScheduleType, ScheduleValue } from '@/types/series'

// POST /api/series/cron - Cron handler for updating series schedules
export async function POST(request: NextRequest) {
    try {
        // Validate cron secret
        const cronSecret = request.headers.get('X-Cron-Secret')
        const expectedSecret = process.env.CRON_SECRET

        console.log(`secret exists? ${!!process.env.CRON_SECRET}`)
        if (!expectedSecret || cronSecret !== expectedSecret) {
            console.log('Cron: Unauthorized request')
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 },
            )
        }

        console.log('Cron: Starting series schedule update')

        // Get user timezone from config
        let timezone = 'Asia/Hong_Kong' // Default
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
            console.warn('Cron: Could not fetch timezone config, using default')
        }

        const now = new Date()

        // Fetch all active series where nextEpisodeAt has passed
        const activeSeries = await db
            .select()
            .from(series)
            .where(
                and(eq(series.isActive, true), lte(series.nextEpisodeAt, now)),
            )

        console.log(`Cron: Found ${activeSeries.length} series to update`)

        let updatedCount = 0
        let deactivatedCount = 0

        for (const s of activeSeries) {
            try {
                const scheduleType = s.scheduleType as ScheduleType
                const scheduleValue = ScheduleService.parseScheduleValue(
                    scheduleType,
                    s.scheduleValue,
                )

                // Calculate missed periods
                const missedPeriods = ScheduleService.calculateMissedPeriods(
                    s.nextEpisodeAt,
                    now,
                    scheduleType,
                    scheduleValue as ScheduleValue,
                    timezone,
                )

                // Calculate new nextEpisodeAt
                let nextEpisodeAt = now
                // Keep advancing until nextEpisodeAt is in the future
                while (nextEpisodeAt <= now) {
                    nextEpisodeAt = ScheduleService.calculateNextEpisodeDate(
                        scheduleType,
                        scheduleValue as ScheduleValue,
                        nextEpisodeAt,
                        timezone,
                    )
                }

                // Check if series has ended
                const hasEnded = s.endDate && new Date(s.endDate) < now

                // Update series
                await db
                    .update(series)
                    .set({
                        missedPeriods: s.missedPeriods + missedPeriods,
                        nextEpisodeAt,
                        isActive: !hasEnded,
                        updatedAt: now,
                    })
                    .where(eq(series.id, s.id))

                if (hasEnded) {
                    deactivatedCount++
                    console.log(`Cron: Deactivated series ${s.id} (ended)`)
                } else {
                    updatedCount++
                }
            } catch (e) {
                console.error(`Cron: Error updating series ${s.id}:`, e)
            }
        }

        console.log(
            `Cron: Completed. Updated: ${updatedCount}, Deactivated: ${deactivatedCount}`,
        )

        return NextResponse.json({
            success: true,
            processed: activeSeries.length,
            updated: updatedCount,
            deactivated: deactivatedCount,
        })
    } catch (error) {
        console.error('Cron: Error in cron handler:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to process series schedules' },
            { status: 500 },
        )
    }
}
