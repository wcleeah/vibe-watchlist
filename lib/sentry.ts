export const sentryConfig = {
    dsn: process.env.SENTRY_DSN!,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
    tracesSampleRate: parseFloat(
        process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1',
    ),
}
