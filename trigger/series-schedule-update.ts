import { schedules } from '@trigger.dev/sdk/v3'

import { SeriesUpdateService } from '@/lib/services/series-update-service'

export const updateSeriesSchedules = schedules.task({
    id: 'update-series-schedules',
    cron: {
        pattern: '0 0 * * *',
        timezone: 'Asia/Hong_Kong',
    },
    run: async ({ timestamp }) => {
        console.log('Trigger.dev: Starting series schedule update', {
            timestamp: timestamp.toISOString(),
        })

        const result = await SeriesUpdateService.updateSeriesSchedules()

        console.log(
            `Trigger.dev: Series schedule update completed. ` +
                `Series — Processed: ${result.processed}, Updated: ${result.updated}, Deactivated: ${result.deactivated}, Errors: ${result.errors}. ` +
                `Seasons — Processed: ${result.seasonsProcessed}, Updated: ${result.seasonsUpdated}, Deactivated: ${result.seasonsDeactivated}, Errors: ${result.seasonsErrors}. ` +
                `Total — Processed: ${result.totalProcessed}, Updated: ${result.totalUpdated}, Deactivated: ${result.totalDeactivated}, Errors: ${result.totalErrors}.`,
        )

        return {
            ...result,
            timestamp: timestamp.toISOString(),
        }
    },
})
