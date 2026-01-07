# Analytics

## Problem statement
The current Analytics page looks pretty good, wanna add more statistics, not sure what to add tho.

## High level details:
- I dun know what to add haha, on top of the static data calculation, i also want to have these:
  - Add vid event
  - Watch vid event
  - Token usage
  - Search count
  - Average accuracy
  - many more
- I do know i want it to be a event driven data collection system
  - Action triggers some kind of event, it get fired to a queue
  - Async worker process it, save it somewhere
  - Another async worker process all the data, create snapshots
- I also want to view it by different time range, thats why i want snapshot, and delta event

## Implementation Plan

### Updated Approach
- **Calculation Method**: Runtime aggregation from events (no snapshots yet - calculate on-demand for time ranges)
- **Worker Strategy**: Infinite loop polling DB every minute (simple Node.js script for now; can migrate to separate Go worker later if needed for concurrency)
- **Event List**: Added comprehensive list of unimplemented events beyond the initial ones

### Complete Implementation Plan

#### Phase 1: Event Infrastructure (1-2 days)
1. Extend `analyticsEvents` schema with:
   - `eventType` (enum: add_video, watch_video, search_performed, token_used, metadata_accuracy, delete_video, bulk_operation, cache_hit, cache_miss, platform_configured, tag_created, metadata_extract_success, metadata_extract_failure, ui_interaction)
   - `payload` (JSONB: flexible metadata like {url, platform, tokens, accuracy, count, etc.})
   - `timestamp`, `processed` (boolean for potential future batch processing)
2. Create event logging utility (`lib/analytics/events.ts`) with async queue insertion
3. Integrate event firing throughout the app:
   - Video operations (add, delete, watch/unwatch, bulk actions)
   - Metadata extraction (success/failure, token usage, accuracy)
   - Search/cache operations (hits, misses)
   - UI interactions (page views, button clicks for engagement metrics)
   - Configuration changes (platform/tag management)

#### Phase 2: Queue Processing Worker (2 days)
4. Create worker script (`scripts/analytics-worker.js`) with infinite loop:
   - Poll `analyticsEvents` table every minute for unprocessed events
   - Basic processing: mark as processed (for future expansion)
   - Add graceful shutdown handling
   - Optional: Migrate to Go worker for better concurrency if performance needs arise

#### Phase 3: Enhanced Dashboard (3-4 days)
5. Split `AnalyticsDashboard` into two sections:
   - **Live Section**: Current real-time stats + new accumulated metrics (total events, token usage, etc.)
   - **Snapshot Section**: Runtime-calculated historical views
     - Time range picker (last hour, day, week, month)
     - Aggregate metrics: event counts, trends, averages
     - Charts: line graphs for time-series, bar charts for distributions
6. Add runtime aggregation functions (`lib/analytics/aggregators.ts`)
7. Create new API endpoints (`/api/analytics/events`, `/api/analytics/aggregated`)
8. Update UI with loading states and error handling

#### Phase 4: Additional Events & Refinement (2 days)
9. Implement comprehensive event logging for all identified types
10. Add data export (CSV/JSON) for raw events
11. Performance monitoring and optimization
12. Documentation for event schema and usage

### Comprehensive List of Unimplemented Events
Based on codebase analysis and common analytics patterns:
- **Video Management**: add_video, watch_video, unwatch_video, delete_video, bulk_watch, bulk_unwatch, bulk_delete
- **Metadata & AI**: metadata_extract_success, metadata_extract_failure, token_used, search_performed, cache_hit, cache_miss, metadata_accuracy_recorded
- **Platform/Config**: platform_configured, platform_tested, tag_created, tag_deleted, tag_assigned, tag_unassigned
- **UI/Engagement**: page_view_analytics, page_view_list, page_view_settings, button_click_add_video, button_click_bulk_action, ui_interaction_search
- **System**: app_launch (if we add sessions), error_occurred, api_request, api_response

### Key Decisions
- **Runtime Calculation**: Simpler initial implementation, can add snapshots later if query performance suffers
- **Polling Worker**: Infinite loop every minute provides near-real-time processing without complex infrastructure
- **Event Completeness**: Comprehensive list covers all major user/system interactions for rich analytics
