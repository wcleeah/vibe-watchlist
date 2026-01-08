import * as Sentry from '@sentry/nextjs'

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
    tracesSampleRate: parseFloat(
        process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1',
    ),
    // Integrations are automatically configured for Next.js
    // API routes, HTTP requests, and database queries will be traced
})
