/**
 * Custom Cloudflare Worker that wraps OpenNext and adds cron support.
 * This worker handles both regular HTTP requests (via OpenNext) and
 * scheduled cron events (by calling the /api/series/cron endpoint).
 */

// Cloudflare Worker types
interface ExecutionContext {
    waitUntil(promise: Promise<unknown>): void
    passThroughOnException(): void
}

interface ScheduledEvent {
    scheduledTime: number
    cron: string
}

// Import the OpenNext handler - generated at build time
import worker from './.open-next/worker.js'

export interface Env {
    CRON_SECRET: string
    WORKER_URL?: string
    [key: string]: unknown
}

export default {
    // Handle regular HTTP requests - delegate to OpenNext
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext,
    ): Promise<Response> {
        return worker.fetch(request, env, ctx)
    },

    // Handle scheduled cron events
    async scheduled(
        event: ScheduledEvent,
        env: Env,
        ctx: ExecutionContext,
    ): Promise<void> {
        console.log(`Cron triggered at ${event.scheduledTime}`)

        // Get the worker's own URL to call the cron endpoint
        // We'll use the cron trigger name as a hint for the base URL
        const baseUrl = env.WORKER_URL || 'https://vibe-watchlist.pages.dev'

        try {
            const response = await fetch(`${baseUrl}/api/series/cron`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Cron-Secret': env.CRON_SECRET || '',
                },
            })

            if (!response.ok) {
                const error = await response.text()
                console.error(`Cron job failed: ${response.status} - ${error}`)
                throw new Error(`Cron job failed: ${response.status}`)
            }

            const result = await response.json()
            console.log('Cron job completed:', result)
        } catch (error) {
            console.error('Cron execution error:', error)
            throw error
        }
    },
}

// Re-export Durable Objects from the generated worker
export {
    BucketCachePurge,
    DOQueueHandler,
    DOShardedTagCache,
} from './.open-next/worker.js'
