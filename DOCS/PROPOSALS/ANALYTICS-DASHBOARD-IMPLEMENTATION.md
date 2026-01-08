# Analytics Dashboard Implementation Plan

## Overview
Implement a comprehensive analytics dashboard for Vibe Watchlist to provide insights into usage metrics, user behavior patterns, and performance indicators across customizable time ranges (down to hours).

## Current Event Logging Status

### ✅ Already Logged Events:
- `video_added`, `video_watched`, `video_deleted`, `bulk_operation`
- `ai_token_used` (currently only total tokens - needs enhancement)
- `metadata_extract_success/failure`
- `tag_created/deleted`
- `platform_configured`
- `search_performed`

### ❌ Missing Events:
- `suggestion_accepted`: When users accept AI suggestions (title/thumbnail/platform)
- `platform_suggestion_accepted`: When users accept platform discovery suggestions

## Implementation Phases

### Phase 1: Enhanced Event Logging (2-3 hours)
- [ ] Update `lib/services/ai-service.ts` to log all token types (input, output, total)
- [ ] Add `suggestion_accepted` logging in `components/video-form/form-layout.tsx`
- [ ] Add `platform_suggestion_accepted` logging in `components/video-form/platform-suggestions.tsx`
- [ ] Test that all new events are logged correctly

### Phase 2: Backend Aggregation APIs (4-5 hours)
- [ ] Create `/api/analytics/metrics` - Core metrics (totals/averages/per-platform)
- [ ] Create `/api/analytics/temporal` - Time-based data (hot hours, period filtering)
- [ ] Create `/api/analytics/tags` - Tag tendency analysis
- [ ] Add date range filtering to all endpoints
- [ ] Test API responses with sample data

### Phase 3: Frontend Dashboard (4-5 hours)
- [ ] Create/update `app/analytics/page.tsx` with date range controls
- [ ] Implement metric cards (totals, averages)
- [ ] Add platform breakdown visualizations
- [ ] Create charts with Recharts:
  - [ ] Line chart for hot hours
  - [ ] Bar chart for tag distribution/watch rates
  - [ ] Stacked bar for token input vs output per platform
- [ ] Test dashboard responsiveness and data loading

### Phase 4: Integration & Testing (2-3 hours)
- [ ] Verify all events flow through to dashboard
- [ ] Test time range filtering (hours to months)
- [ ] Performance testing with large datasets
- [ ] Error handling for missing data scenarios

## Technical Specifications

### Backend APIs
- **`/api/analytics/metrics`**: Returns aggregated metrics by dimension (total/average/platform)
- **`/api/analytics/temporal`**: Time-series data with hourly granularity
- **`/api/analytics/tags`**: Tag analysis with watch rate calculations

### Frontend Components
- Date range picker with preset options
- Metric display cards
- Recharts visualizations
- Responsive design for mobile/desktop

### Database Considerations
- Uses existing `analytics_events` table
- May need indexes on `createdAt`, `eventType` for performance
- All aggregations done via SQL queries

## Success Criteria
- [ ] Dashboard loads within 2 seconds
- [ ] All time ranges work correctly (hourly to monthly)
- [ ] Metrics update in real-time as new events are logged
- [ ] Platform and tag breakdowns show meaningful patterns
- [ ] No performance degradation on existing functionality

## Timeline Estimate
- **Total**: 10-13 hours
- **Phase 1**: Enhanced logging (2-3 hours)
- **Phase 2**: Backend APIs (4-5 hours)
- **Phase 3**: Frontend dashboard (4-5 hours)
- **Phase 4**: Integration & testing (2-3 hours)

## Progress Tracking

### Completed Tasks:
- [x] Plan created and documented (2025-01-08)

### Current Status:
- **Phase**: Starting Phase 1
- **Last Update**: 2025-01-08
- **Next Milestone**: Enhanced event logging complete

## Notes
- Keep implementation simple and focused
- Use existing patterns and libraries (Drizzle, Recharts)
- Test incrementally to avoid breaking changes
- Commit frequently with descriptive messages</content>
<parameter name="filePath">DOCS/PROPOSALS/ANALYTICS-DASHBOARD-IMPLEMENTATION.md