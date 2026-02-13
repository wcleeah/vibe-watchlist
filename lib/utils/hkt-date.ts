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
 * Internal helper: extract HKT date/time components from any Date/string/number.
 * Uses Intl.DateTimeFormat to correctly resolve HKT components regardless of
 * the server's local timezone.
 */
function getHKTParts(date: Date | string | number): {
    year: number
    month: number // 1-indexed (1 = January)
    day: number
    hour: number
    minute: number
    second: number
} {
    const inputDate =
        typeof date === 'string' || typeof date === 'number'
            ? new Date(date)
            : date

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
    const get = (type: string): number =>
        parseInt(parts.find((p) => p.type === type)?.value || '0', 10)

    return {
        year: get('year'),
        month: get('month'), // 1-indexed from Intl
        day: get('day'),
        hour: get('hour'),
        minute: get('minute'),
        second: get('second'),
    }
}

/**
 * Create a Date representing a specific moment in HKT timezone.
 * Returns a Date whose UTC instant correctly corresponds to the given
 * HKT components, regardless of the server's local timezone.
 *
 * @param month 1-indexed (1 = January)
 */
export function createDateInHKT(
    year: number,
    month: number,
    day: number,
    hour = 0,
    minute = 0,
    second = 0,
    ms = 0,
): Date {
    // Create an ISO string in HKT timezone and parse it
    // Format: YYYY-MM-DDTHH:mm:ss.sss+08:00
    const isoString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}.${String(ms).padStart(3, '0')}+08:00`
    return new Date(isoString)
}

/**
 * Convert a date to HKT timezone.
 * Returns a Date whose UTC instant correctly represents the same moment,
 * re-created via createDateInHKT to ensure the UTC value is accurate
 * regardless of the server's local timezone.
 */
export function toHKT(date: Date | string | number = new Date()): Date {
    const { year, month, day, hour, minute, second } = getHKTParts(date)
    return createDateInHKT(year, month, day, hour, minute, second, 0)
}

/**
 * Get the day of the week in HKT (0 = Sunday, 6 = Saturday).
 * Equivalent to Date.getDay() but timezone-aware for HKT.
 */
export function getHKTDayOfWeek(date: Date | string | number): number {
    const { year, month, day } = getHKTParts(date)
    // Create a date from HKT components in UTC to get the correct day of week
    // We use UTC methods to avoid any local timezone interference
    const d = new Date(Date.UTC(year, month - 1, day))
    return d.getUTCDay()
}

/**
 * Get the start of the day (00:00:00) in HKT for the given date
 */
export function getStartOfHKTDay(date: Date | string | number): Date {
    const { year, month, day } = getHKTParts(date)
    return createDateInHKT(year, month, day, 0, 0, 0, 0)
}

/**
 * Get the end of the day (23:59:59.999) in HKT for the given date
 */
export function getEndOfHKTDay(date: Date | string | number): Date {
    const { year, month, day } = getHKTParts(date)
    return createDateInHKT(year, month, day, 23, 59, 59, 999)
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
    const d1 = getHKTParts(date1)
    const d2 = getHKTParts(date2)
    return d1.year === d2.year && d1.month === d2.month && d1.day === d2.day
}

/**
 * Add days to a date in HKT
 */
export function addHKTDays(date: Date | string | number, days: number): Date {
    const { year, month, day, hour, minute, second } = getHKTParts(date)
    // createDateInHKT handles day overflow correctly via Date parsing
    return createDateInHKT(year, month, day + days, hour, minute, second, 0)
}

/**
 * Format a date for display in HKT
 */
export function formatHKTDate(
    date: Date | string | number,
    options: Intl.DateTimeFormatOptions = {},
): string {
    const inputDate =
        typeof date === 'string' || typeof date === 'number'
            ? new Date(date)
            : date
    return inputDate.toLocaleString('en-US', {
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
    const { year, month, day, hour, minute, second } = getHKTParts(date)
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}.000+08:00`
}

/**
 * Parse a date string and convert to HKT
 * Handles both date-only strings (YYYY-MM-DD) and full ISO strings
 */
export function parseToHKT(dateString: string): Date {
    // If it's just a date (YYYY-MM-DD), treat it as start of day in HKT
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number)
        // Use createDateInHKT to ensure it's created in HKT timezone
        return createDateInHKT(year, month, day, 0, 0, 0, 0)
    }

    // Otherwise parse as normal and convert to HKT
    return toHKT(dateString)
}

/**
 * Check if a date is the sentinel date (9999-12-31) used for backlog series
 */
export function isSentinelDate(date: Date | string | number): boolean {
    const { year, month, day } = getHKTParts(date)
    return year === 9999 && month === 12 && day === 31
}

/**
 * Create a sentinel date for backlog series
 */
export function createSentinelDate(): Date {
    return createDateInHKT(9999, 12, 31, 23, 59, 59, 999) // Dec 31, 9999 in HKT
}

/**
 * Format a date as YYYY-MM-DD string in HKT timezone
 * Useful for API responses that need date-only format
 */
export function formatDateToHKTString(
    date: Date | string | number | null,
): string | null {
    if (!date) return null
    const { year, month, day } = getHKTParts(date)
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
