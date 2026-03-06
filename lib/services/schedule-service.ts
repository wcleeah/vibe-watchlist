import {
    addHKTDays,
    createDateInHKT,
    createSentinelDate,
    getHKTDayOfWeek,
    parseToHKT,
    toHKT,
} from '@/lib/utils/hkt-date'
import type {
    DailySchedule,
    DateScheduleEntry,
    DatesSchedule,
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
     * Parse HKT time string (e.g. "20:00") into hours and minutes.
     * Returns null if the time string is missing or invalid.
     */
    private static parseTimeOfDay(
        scheduleValue: ScheduleValue,
    ): { hour: number; minute: number } | null {
        const time = (scheduleValue as { time?: string }).time
        if (!time || !/^\d{2}:\d{2}$/.test(time)) return null
        const [hour, minute] = time.split(':').map(Number)
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
        return { hour, minute }
    }

    /**
     * Apply time-of-day to a date computed by schedule logic.
     * If `scheduleValue` has a `time` field (HKT), the returned date's
     * HKT hours/minutes are set to that time. Otherwise returns as-is.
     */
    private static applyTimeOfDay(
        date: Date,
        scheduleValue: ScheduleValue,
    ): Date {
        const tod = ScheduleService.parseTimeOfDay(scheduleValue)
        if (!tod) return date

        // Extract HKT date parts from `date`, then rebuild with the specified time
        const hkt = toHKT(date)
        // Get year/month/day from the HKT representation
        const fmt = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Hong_Kong',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour12: false,
        })
        const parts = fmt.formatToParts(hkt)
        const get = (type: string): number =>
            parseInt(parts.find((p) => p.type === type)?.value || '0', 10)
        return createDateInHKT(
            get('year'),
            get('month'),
            get('day'),
            tod.hour,
            tod.minute,
            0,
            0,
        )
    }

    /**
     * Calculate the next episode date based on schedule.
     * When the schedule includes a `time` field (HKT time-of-day),
     * the returned date is set to that specific time.
     */
    static calculateNextEpisodeDate(
        scheduleType: ScheduleType,
        scheduleValue: ScheduleValue,
        fromDate: Date,
        _timezone: string = 'Asia/Hong_Kong',
    ): Date {
        // Backlog series don't have schedules - return far future date
        if (scheduleType === 'none') {
            return createSentinelDate()
        }

        // Convert to HKT timezone
        const localDate = toHKT(fromDate)

        let result: Date
        switch (scheduleType) {
            case 'daily':
            case 'custom': {
                const interval = (scheduleValue as DailySchedule).interval
                result = addHKTDays(localDate, interval)
                break
            }
            case 'weekly': {
                const days = (scheduleValue as WeeklySchedule).days
                result = ScheduleService.getNextWeeklyDate(localDate, days)
                break
            }
            case 'dates': {
                const entries = (scheduleValue as DatesSchedule).entries
                result = ScheduleService.getNextDatesScheduleDate(
                    localDate,
                    entries,
                )
                break
            }
            default:
                throw new Error(`Unknown schedule type: ${scheduleType}`)
        }

        // Apply time-of-day if specified
        return ScheduleService.applyTimeOfDay(result, scheduleValue)
    }

    /**
     * Calculate how many new episodes have aired since a given date.
     * Used by the cron job to increment episodesAired.
     * When the schedule has a `time` field, episodes only count as aired
     * after that HKT time on the scheduled day.
     */
    static calculateNewEpisodesSinceDate(
        sinceDate: Date,
        now: Date,
        scheduleType: ScheduleType,
        scheduleValue: ScheduleValue,
        _timezone: string = 'Asia/Hong_Kong',
    ): number {
        // Backlog series don't have scheduled episodes
        if (scheduleType === 'none') {
            return 0
        }

        // Convert both dates to HKT for comparison
        const localNow = toHKT(now)
        const localSince = toHKT(sinceDate)

        if (localNow < localSince) {
            return 0
        }

        const tod = ScheduleService.parseTimeOfDay(scheduleValue)
        const diffMs = localNow.getTime() - localSince.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        switch (scheduleType) {
            case 'daily':
            case 'custom': {
                const interval = (scheduleValue as DailySchedule).interval
                if (!tod) {
                    return Math.floor(diffDays / interval) + 1
                }
                // With time-of-day: count scheduled dates whose HKT time has passed
                let count = 0
                let dayOffset = 0
                while (dayOffset <= diffDays + 1) {
                    const checkDate = addHKTDays(localSince, dayOffset)
                    const withTime = ScheduleService.applyTimeOfDay(
                        checkDate,
                        scheduleValue,
                    )
                    if (
                        withTime.getTime() >= localSince.getTime() &&
                        withTime.getTime() <= localNow.getTime()
                    ) {
                        count++
                    }
                    dayOffset += interval
                }
                return count
            }
            case 'weekly': {
                const days = (scheduleValue as WeeklySchedule).days
                // Count how many scheduled days have passed
                let count = 0
                let i = 0
                while (true) {
                    const checkDate = addHKTDays(localSince, i)
                    if (checkDate.getTime() > localNow.getTime()) break
                    const dayName = DAY_NAMES[getHKTDayOfWeek(checkDate)]
                    if (days.includes(dayName)) {
                        if (tod) {
                            // Only count if the specific time has passed
                            const withTime = ScheduleService.applyTimeOfDay(
                                checkDate,
                                scheduleValue,
                            )
                            if (withTime.getTime() <= localNow.getTime()) {
                                count++
                            }
                        } else {
                            count++
                        }
                    }
                    i++
                }
                return count
            }
            case 'dates': {
                const entries = (scheduleValue as DatesSchedule).entries
                // Count total episodes from dates that have passed
                let count = 0
                for (const entry of entries) {
                    let entryDate = parseToHKT(entry.date)
                    if (tod) {
                        entryDate = ScheduleService.applyTimeOfDay(
                            entryDate,
                            scheduleValue,
                        )
                    }
                    if (
                        entryDate.getTime() <= localNow.getTime() &&
                        entryDate.getTime() >= localSince.getTime()
                    ) {
                        count += entry.episodes
                    }
                }
                return count
            }
            default:
                return 0
        }
    }

    /**
     * Format schedule for display.
     * Appends "at HH:MM HKT" when a time-of-day is set.
     */
    static formatScheduleDisplay(
        scheduleType: ScheduleType,
        scheduleValue: ScheduleValue,
    ): string {
        const tod = ScheduleService.parseTimeOfDay(scheduleValue)
        const timeSuffix = tod
            ? ` at ${String(tod.hour).padStart(2, '0')}:${String(tod.minute).padStart(2, '0')} HKT`
            : ''

        switch (scheduleType) {
            case 'none':
                return 'No schedule'
            case 'daily': {
                const interval = (scheduleValue as DailySchedule).interval
                if (interval === 1) {
                    return `Every day${timeSuffix}`
                }
                return `Every ${interval} days${timeSuffix}`
            }
            case 'weekly': {
                const days = (scheduleValue as WeeklySchedule).days
                const capitalizedDays = days.map(
                    (d) => d.charAt(0).toUpperCase() + d.slice(1),
                )
                let base: string
                if (days.length === 1) {
                    base = `Every ${capitalizedDays[0]}`
                } else if (days.length === 2) {
                    base = `Every ${capitalizedDays[0]} and ${capitalizedDays[1]}`
                } else {
                    base = `Every ${capitalizedDays.slice(0, -1).join(', ')}, and ${capitalizedDays[capitalizedDays.length - 1]}`
                }
                return `${base}${timeSuffix}`
            }
            case 'custom': {
                const interval = (scheduleValue as DailySchedule).interval
                let base: string
                if (interval === 7) {
                    base = 'Every week'
                } else if (interval === 14) {
                    base = 'Every 2 weeks'
                } else if (interval % 7 === 0) {
                    base = `Every ${interval / 7} weeks`
                } else {
                    base = `Every ${interval} days`
                }
                return `${base}${timeSuffix}`
            }
            case 'dates': {
                const entries = (scheduleValue as DatesSchedule).entries
                if (entries.length === 0) {
                    return 'No dates set'
                }
                const totalEpisodes = entries.reduce(
                    (sum, e) => sum + e.episodes,
                    0,
                )
                return `${entries.length} dates (${totalEpisodes} episodes)${timeSuffix}`
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
            case 'dates':
                return { entries: [] }
            case 'none':
                return {}
        }
    }

    /**
     * Parse and validate schedule value from JSON.
     * Preserves the optional `time` field (HKT time-of-day for scheduling).
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

        // Extract optional time field (HKT time-of-day, e.g. "20:00")
        const time =
            typeof obj.time === 'string' && /^\d{2}:\d{2}$/.test(obj.time)
                ? obj.time
                : undefined
        const timeField = time ? { time } : {}

        switch (type) {
            case 'daily':
            case 'custom': {
                const interval =
                    typeof obj.interval === 'number' ? obj.interval : 1
                return { interval: Math.max(1, interval), ...timeField }
            }
            case 'weekly': {
                const days = Array.isArray(obj.days)
                    ? (obj.days.filter((d) =>
                          DAY_NAMES.includes(d as DayOfWeek),
                      ) as DayOfWeek[])
                    : (['friday'] as DayOfWeek[])
                return {
                    days: days.length > 0 ? days : (['friday'] as DayOfWeek[]),
                    ...timeField,
                }
            }
            case 'dates': {
                const entries = Array.isArray(obj.entries)
                    ? obj.entries
                          .filter(
                              (e): e is { date: string; episodes: number } =>
                                  typeof e === 'object' &&
                                  e !== null &&
                                  typeof e.date === 'string' &&
                                  typeof e.episodes === 'number' &&
                                  e.episodes >= 1,
                          )
                          .map((e) => ({
                              date: e.date,
                              episodes: Math.max(1, e.episodes),
                          }))
                    : []
                return { entries, ...timeField }
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
            case 'dates': {
                const dtv = value as DatesSchedule
                return (
                    Array.isArray(dtv.entries) &&
                    dtv.entries.every(
                        (e) =>
                            typeof e.date === 'string' &&
                            typeof e.episodes === 'number' &&
                            e.episodes >= 1,
                    )
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
        const currentDay = getHKTDayOfWeek(fromDate)

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

        return addHKTDays(fromDate, daysToAdd)
    }

    /**
     * Get the next date for a dates schedule (specific release dates)
     */
    private static getNextDatesScheduleDate(
        fromDate: Date,
        entries: DateScheduleEntry[],
    ): Date {
        // Sort entries by date
        const sortedEntries = [...entries].sort(
            (a, b) =>
                parseToHKT(a.date).getTime() - parseToHKT(b.date).getTime(),
        )

        // Find the next entry after fromDate
        const fromTime = fromDate.getTime()
        for (const entry of sortedEntries) {
            const entryDate = parseToHKT(entry.date)
            if (entryDate.getTime() > fromTime) {
                return entryDate
            }
        }

        // No future dates - return far future date (series ended)
        return createSentinelDate()
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
