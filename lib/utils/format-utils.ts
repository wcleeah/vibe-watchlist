/**
 * Format a number with locale-specific thousand separators
 */
export function formatNumber(num: number): string {
    return num.toLocaleString()
}

/**
 * Format a date string to locale-specific date/time string
 */
export function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleString()
}

/**
 * Format milliseconds to seconds with 3 decimal places
 */
export function formatDuration(ms: number | null | undefined): string {
    if (ms == null) return '-'
    return `${(ms / 1000).toFixed(3)}s`
}

/**
 * Format a date to locale-specific date string (no time)
 */
export function formatDateOnly(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString()
}

/**
 * Format a date to locale-specific time string (no date)
 */
export function formatTimeOnly(date: Date): string {
    return date.toLocaleTimeString()
}
