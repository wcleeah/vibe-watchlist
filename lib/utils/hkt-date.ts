/**
 * HKT (Hong Kong Time) Date Utilities
 *
 * All dates in the application should be stored and processed as HKT.
 * These utilities ensure consistent timezone handling across the codebase.
 *
 * HKT = UTC+8 (no daylight saving time)
 */

const HKT_TIMEZONE = 'Asia/Hong_Kong'

/**
 * Convert a date to HKT timezone
 * Returns a new Date object representing the same moment in time,
 * but with components adjusted to HKT timezone
 */
export function toHKT(date: Date | string | number = new Date()): Date {
    const inputDate =
        typeof date === 'string' || typeof date === 'number'
            ? new Date(date)
            : new Date(date.getTime())

    // Use Intl.DateTimeFormat to get HKT components
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: HKT_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    })

    const parts = formatter.formatToParts(inputDate)
    const getPart = (type: string): string =>
        parts.find((p) => p.type === type)?.value || '0'

    // Create new date with HKT components (month is 0-indexed in Date constructor)
    return new Date(
        parseInt(getPart('year')),
        parseInt(getPart('month')) - 1,
        parseInt(getPart('day')),
        parseInt(getPart('hour')),
        parseInt(getPart('minute')),
        parseInt(getPart('second')),
    )
}

/**
 * Get the start of the day (00:00:00) in HKT for the given date
 */
export function getStartOfHKTDay(date: Date | string | number): Date {
    const hktDate = toHKT(date)
    return new Date(
        hktDate.getFullYear(),
        hktDate.getMonth(),
        hktDate.getDate(),
        0,
        0,
        0,
        0,
    )
}

/**
 * Get the end of the day (23:59:59.999) in HKT for the given date
 */
export function getEndOfHKTDay(date: Date | string | number): Date {
    const hktDate = toHKT(date)
    return new Date(
        hktDate.getFullYear(),
        hktDate.getMonth(),
        hktDate.getDate(),
        23,
        59,
        59,
        999,
    )
}

/**
 * Get current time in HKT
 */
export function nowHKT(): Date {
    return toHKT(new Date())
}

/**
 * Compare two dates in HKT timezone
 * Returns true if date1 is before date2 (comparing full timestamps)
 */
export function isHKTBefore(
    date1: Date | string | number,
    date2: Date | string | number,
): boolean {
    return toHKT(date1).getTime() < toHKT(date2).getTime()
}

/**
 * Compare two dates in HKT timezone
 * Returns true if date1 is after date2 (comparing full timestamps)
 */
export function isHKTAfter(
    date1: Date | string | number,
    date2: Date | string | number,
): boolean {
    return toHKT(date1).getTime() > toHKT(date2).getTime()
}

/**
 * Check if date1 is on the same day or before date2 in HKT
 * This is useful for endDate comparisons where we want to include the end date
 */
export function isHKTSameOrBefore(
    date1: Date | string | number,
    date2: Date | string | number,
): boolean {
    return toHKT(date1).getTime() <= toHKT(date2).getTime()
}

/**
 * Check if two dates are on the same calendar day in HKT
 */
export function isHKTSameDay(
    date1: Date | string | number,
    date2: Date | string | number,
): boolean {
    const d1 = toHKT(date1)
    const d2 = toHKT(date2)
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    )
}

/**
 * Add days to a date in HKT
 */
export function addHKTDays(date: Date | string | number, days: number): Date {
    const hktDate = toHKT(date)
    const result = new Date(hktDate)
    result.setDate(result.getDate() + days)
    return result
}

/**
 * Format a date for display in HKT
 */
export function formatHKTDate(
    date: Date | string | number,
    options: Intl.DateTimeFormatOptions = {},
): string {
    const hktDate = toHKT(date)
    return hktDate.toLocaleString('en-US', {
        timeZone: HKT_TIMEZONE,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options,
    })
}

/**
 * Format date as ISO string but in HKT timezone
 * Note: This creates a date string that looks like ISO but represents HKT time
 */
export function toHKTISOString(date: Date | string | number): string {
    const hktDate = toHKT(date)
    // Format as YYYY-MM-DDTHH:mm:ss.sss+08:00 (HKT offset)
    const year = hktDate.getFullYear()
    const month = String(hktDate.getMonth() + 1).padStart(2, '0')
    const day = String(hktDate.getDate()).padStart(2, '0')
    const hour = String(hktDate.getHours()).padStart(2, '0')
    const minute = String(hktDate.getMinutes()).padStart(2, '0')
    const second = String(hktDate.getSeconds()).padStart(2, '0')
    const ms = String(hktDate.getMilliseconds()).padStart(3, '0')

    return `${year}-${month}-${day}T${hour}:${minute}:${second}.${ms}+08:00`
}

/**
 * Parse a date string and convert to HKT
 * Handles both date-only strings (YYYY-MM-DD) and full ISO strings
 */
export function parseToHKT(dateString: string): Date {
    // If it's just a date (YYYY-MM-DD), treat it as start of day in HKT
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number)
        // Month is 0-indexed in Date constructor
        return new Date(year, month - 1, day, 0, 0, 0)
    }

    // Otherwise parse as normal and convert to HKT
    return toHKT(dateString)
}

/**
 * Check if a date is the sentinel date (9999-12-31) used for backlog series
 */
export function isSentinelDate(date: Date | string | number): boolean {
    const hktDate = toHKT(date)
    return (
        hktDate.getFullYear() === 9999 &&
        hktDate.getMonth() === 11 && // December (0-indexed)
        hktDate.getDate() === 31
    )
}

/**
 * Create a sentinel date for backlog series
 */
export function createSentinelDate(): Date {
    return new Date(9999, 11, 31, 23, 59, 59, 999) // Dec 31, 9999
}
