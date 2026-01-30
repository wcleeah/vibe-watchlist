import type {
    DailySchedule,
    DayOfWeek,
    NoSchedule,
    ScheduleType,
    ScheduleValue,
    WeeklySchedule,
} from '@/types/series'

// Day of week mapping (0 = Sunday, 1 = Monday, etc.)
const DAY_MAP: Record<DayOfWeek, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
}

const DAY_NAMES: DayOfWeek[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
]

/**
 * Service for handling schedule calculations for series
 */
export class ScheduleService {
    /**
     * Calculate the next episode date based on schedule
     */
    static calculateNextEpisodeDate(
        scheduleType: ScheduleType,
        scheduleValue: ScheduleValue,
        fromDate: Date,
        timezone: string = 'Asia/Hong_Kong',
    ): Date {
        // Backlog series don't have schedules - return far future date
        if (scheduleType === 'none') {
            return new Date('9999-12-31T23:59:59Z')
        }

        // Convert to timezone-aware date
        const localDate = ScheduleService.toTimezone(fromDate, timezone)

        switch (scheduleType) {
            case 'daily':
            case 'custom': {
                const interval = (scheduleValue as DailySchedule).interval
                const nextDate = new Date(localDate)
                nextDate.setDate(nextDate.getDate() + interval)
                return nextDate
            }
            case 'weekly': {
                const days = (scheduleValue as WeeklySchedule).days
                return ScheduleService.getNextWeeklyDate(localDate, days)
            }
            default:
                throw new Error(`Unknown schedule type: ${scheduleType}`)
        }
    }

    /**
     * Calculate how many periods have been missed since the next episode date
     */
    static calculateMissedPeriods(
        nextEpisodeAt: Date,
        now: Date,
        scheduleType: ScheduleType,
        scheduleValue: ScheduleValue,
        timezone: string = 'Asia/Hong_Kong',
    ): number {
        // Backlog series don't track missed periods
        if (scheduleType === 'none') {
            return 0
        }

        const localNow = ScheduleService.toTimezone(now, timezone)
        const localNextEpisode = ScheduleService.toTimezone(
            nextEpisodeAt,
            timezone,
        )

        if (localNow < localNextEpisode) {
            return 0
        }

        const diffMs = localNow.getTime() - localNextEpisode.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        switch (scheduleType) {
            case 'daily':
            case 'custom': {
                const interval = (scheduleValue as DailySchedule).interval
                return Math.floor(diffDays / interval) + 1
            }
            case 'weekly': {
                const days = (scheduleValue as WeeklySchedule).days
                // Count how many scheduled days have passed
                let count = 0
                const checkDate = new Date(localNextEpisode)
                while (checkDate <= localNow) {
                    const dayName = DAY_NAMES[checkDate.getDay()]
                    if (days.includes(dayName)) {
                        count++
                    }
                    checkDate.setDate(checkDate.getDate() + 1)
                }
                return count
            }
            default:
                return 0
        }
    }

    /**
     * Format schedule for display
     */
    static formatScheduleDisplay(
        scheduleType: ScheduleType,
        scheduleValue: ScheduleValue,
    ): string {
        switch (scheduleType) {
            case 'none':
                return 'No schedule'
            case 'daily': {
                const interval = (scheduleValue as DailySchedule).interval
                if (interval === 1) {
                    return 'Every day'
                }
                return `Every ${interval} days`
            }
            case 'weekly': {
                const days = (scheduleValue as WeeklySchedule).days
                const capitalizedDays = days.map(
                    (d) => d.charAt(0).toUpperCase() + d.slice(1),
                )
                if (days.length === 1) {
                    return `Every ${capitalizedDays[0]}`
                }
                if (days.length === 2) {
                    return `Every ${capitalizedDays[0]} and ${capitalizedDays[1]}`
                }
                return `Every ${capitalizedDays.slice(0, -1).join(', ')}, and ${capitalizedDays[capitalizedDays.length - 1]}`
            }
            case 'custom': {
                const interval = (scheduleValue as DailySchedule).interval
                if (interval === 7) {
                    return 'Every week'
                }
                if (interval === 14) {
                    return 'Every 2 weeks'
                }
                if (interval % 7 === 0) {
                    return `Every ${interval / 7} weeks`
                }
                return `Every ${interval} days`
            }
            default:
                return 'Unknown schedule'
        }
    }

    /**
     * Get the default schedule value for a type
     */
    static getDefaultScheduleValue(type: ScheduleType): ScheduleValue {
        switch (type) {
            case 'daily':
                return { interval: 1 }
            case 'weekly':
                return { days: ['friday'] }
            case 'custom':
                return { interval: 7 }
            case 'none':
                return {}
        }
    }

    /**
     * Format the missed periods for display
     */
    static formatMissedPeriods(
        missedPeriods: number,
        scheduleType: ScheduleType,
        scheduleValue: ScheduleValue,
    ): string {
        // Backlog series don't show missed periods
        if (scheduleType === 'none') {
            return ''
        }

        if (missedPeriods === 0) {
            return 'Caught up'
        }

        // For weekly schedules, we say "episodes" since each day is an episode
        // For daily/custom, we use the period terminology
        if (scheduleType === 'weekly') {
            if (missedPeriods === 1) {
                return '1 episode behind'
            }
            return `${missedPeriods} episodes behind`
        }

        // For daily schedules
        if (scheduleType === 'daily') {
            const interval = (scheduleValue as DailySchedule).interval
            if (interval === 1) {
                if (missedPeriods === 1) {
                    return '1 day behind'
                }
                return `${missedPeriods} days behind`
            }
        }

        // For custom schedules, show weeks if applicable
        if (scheduleType === 'custom') {
            const interval = (scheduleValue as DailySchedule).interval
            if (interval === 7) {
                if (missedPeriods === 1) {
                    return '1 week behind'
                }
                return `${missedPeriods} weeks behind`
            }
        }

        // Default
        if (missedPeriods === 1) {
            return '1 period behind'
        }
        return `${missedPeriods} periods behind`
    }

    /**
     * Parse and validate schedule value from JSON
     */
    static parseScheduleValue(
        type: ScheduleType,
        value: unknown,
    ): ScheduleValue {
        // 'none' type has empty schedule value
        if (type === 'none') {
            return {}
        }

        if (!value || typeof value !== 'object') {
            return ScheduleService.getDefaultScheduleValue(type)
        }

        const obj = value as Record<string, unknown>

        switch (type) {
            case 'daily':
            case 'custom': {
                const interval =
                    typeof obj.interval === 'number' ? obj.interval : 1
                return { interval: Math.max(1, interval) }
            }
            case 'weekly': {
                const days = Array.isArray(obj.days)
                    ? (obj.days.filter((d) =>
                          DAY_NAMES.includes(d as DayOfWeek),
                      ) as DayOfWeek[])
                    : (['friday'] as DayOfWeek[])
                return {
                    days: days.length > 0 ? days : (['friday'] as DayOfWeek[]),
                }
            }
            default:
                return ScheduleService.getDefaultScheduleValue(type)
        }
    }

    /**
     * Validate schedule value
     */
    static isValidScheduleValue(
        type: ScheduleType,
        value: ScheduleValue,
    ): boolean {
        switch (type) {
            case 'none': {
                // Empty object is valid for 'none' type
                const nv = value as NoSchedule
                return typeof nv === 'object' && Object.keys(nv).length === 0
            }
            case 'daily':
            case 'custom': {
                const dv = value as DailySchedule
                return (
                    typeof dv.interval === 'number' &&
                    dv.interval >= 1 &&
                    dv.interval <= 365
                )
            }
            case 'weekly': {
                const wv = value as WeeklySchedule
                return (
                    Array.isArray(wv.days) &&
                    wv.days.length > 0 &&
                    wv.days.every((d) => DAY_NAMES.includes(d))
                )
            }
            default:
                return false
        }
    }

    /**
     * Get the next date for a weekly schedule
     */
    private static getNextWeeklyDate(fromDate: Date, days: DayOfWeek[]): Date {
        const sortedDays = days.map((d) => DAY_MAP[d]).sort((a, b) => a - b)
        const currentDay = fromDate.getDay()

        // Find the next scheduled day
        let nextDay = sortedDays.find((d) => d > currentDay)
        let daysToAdd: number

        if (nextDay !== undefined) {
            daysToAdd = nextDay - currentDay
        } else {
            // Wrap to next week
            nextDay = sortedDays[0]
            daysToAdd = 7 - currentDay + nextDay
        }

        const nextDate = new Date(fromDate)
        nextDate.setDate(nextDate.getDate() + daysToAdd)
        return nextDate
    }

    /**
     * Convert a date to a specific timezone
     */
    private static toTimezone(date: Date, timezone: string): Date {
        try {
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            })

            const parts = formatter.formatToParts(date)
            const getPart = (type: string) =>
                parts.find((p) => p.type === type)?.value || '0'

            return new Date(
                parseInt(getPart('year')),
                parseInt(getPart('month')) - 1,
                parseInt(getPart('day')),
                parseInt(getPart('hour')),
                parseInt(getPart('minute')),
                parseInt(getPart('second')),
            )
        } catch {
            // Fallback to original date if timezone is invalid
            return date
        }
    }

    /**
     * Get all available days of the week
     */
    static getAllDays(): { value: DayOfWeek; label: string }[] {
        return [
            { value: 'monday' as DayOfWeek, label: 'Monday' },
            { value: 'tuesday' as DayOfWeek, label: 'Tuesday' },
            { value: 'wednesday' as DayOfWeek, label: 'Wednesday' },
            { value: 'thursday' as DayOfWeek, label: 'Thursday' },
            { value: 'friday' as DayOfWeek, label: 'Friday' },
            { value: 'saturday' as DayOfWeek, label: 'Saturday' },
            { value: 'sunday' as DayOfWeek, label: 'Sunday' },
        ]
    }
}
