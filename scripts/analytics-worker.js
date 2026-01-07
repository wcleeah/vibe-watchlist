import { db } from '../lib/db';
import { analyticsEvents } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Analytics Worker - Processes queued analytics events
 * Runs as an infinite loop polling the database every minute
 */
class AnalyticsWorker {
  private isRunning = false;
  private pollInterval = 60 * 1000; // 1 minute
  private processedCount = 0;

  constructor() {
    // Handle graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  async start() {
    console.log('🚀 Analytics Worker starting...');
    this.isRunning = true;

    while (this.isRunning) {
      try {
        await this.processEvents();
        await this.sleep(this.pollInterval);
      } catch (error) {
        console.error('❌ Analytics Worker error:', error);
        // Continue running despite errors
        await this.sleep(this.pollInterval);
      }
    }
  }

  private async processEvents() {
    // Get unprocessed events (limit to prevent overwhelming)
    const unprocessedEvents = await db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.processed, false))
      .limit(100) // Process in batches
      .orderBy(analyticsEvents.createdAt);

    if (unprocessedEvents.length === 0) {
      return; // No events to process
    }

    console.log(`📊 Processing ${unprocessedEvents.length} events...`);

    // For now, just mark as processed (basic processing)
    // Future: aggregate into snapshots, send to external systems, etc.
    const eventIds = unprocessedEvents.map(e => e.id);

    await db
      .update(analyticsEvents)
      .set({ processed: true })
      .where(sql`${analyticsEvents.id} IN (${eventIds})`);

    this.processedCount += unprocessedEvents.length;
    console.log(`✅ Processed ${unprocessedEvents.length} events (total: ${this.processedCount})`);
  }

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private shutdown() {
    console.log('🛑 Analytics Worker shutting down...');
    console.log(`📈 Total events processed: ${this.processedCount}`);
    this.isRunning = false;
    process.exit(0);
  }
}

// Start the worker if this script is run directly
if (require.main === module) {
  const worker = new AnalyticsWorker();
  worker.start().catch((error) => {
    console.error('Failed to start analytics worker:', error);
    process.exit(1);
  });
}

export { AnalyticsWorker };