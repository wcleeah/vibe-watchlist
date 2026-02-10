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

        console.log('Trigger.dev: Series schedule update completed', result)

        return {
            ...result,
            timestamp: timestamp.toISOString(),
        }
    },
})
