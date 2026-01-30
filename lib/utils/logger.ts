export function logWithTimestamp(
    level: 'log' | 'error' | 'warn',
    message: string,
    ...args: unknown[]
) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}`

    switch (level) {
        case 'log':
            console.log(logMessage, ...args)
            break
        case 'error':
            console.error(logMessage, ...args)
            break
        case 'warn':
            console.warn(logMessage, ...args)
            break
    }
}

export const logger = {
    log: (message: string, ...args: unknown[]) =>
        logWithTimestamp('log', message, ...args),
    error: (message: string, ...args: unknown[]) =>
        logWithTimestamp('error', message, ...args),
    warn: (message: string, ...args: unknown[]) =>
        logWithTimestamp('warn', message, ...args),
}
