# Backlog Series + Watched Series Feature Plan

## Overview
1. Add `scheduleType: 'none'` for backlog/completed series
2. Add episode progress tracking (`totalEpisodes`, `watchedEpisodes`) for all series
3. Add `isWatched` boolean to mark series as finished
4. Add tab-style navigation on /series page: **Active | Watched**
5. Show completion prompts when appropriate

---

## Database Changes

**New columns on `series` table:**

| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| `total_episodes` | `integer` | - | Yes |
| `watched_episodes` | `integer` | `0` | No |
| `is_watched` | `boolean` | `false` | No |

---

## Implementation Checklist

### Phase 1: Schema & Types
- [ ] Update `lib/db/schema.ts` - add new columns
- [ ] Create migration `drizzle/0008_backlog_series.sql`
- [ ] Update `types/series.ts` - add `'none'` to ScheduleType, new fields, helpers

### Phase 2: Services
- [ ] Update `lib/services/schedule-service.ts` - handle `'none'` type
- [ ] Update `lib/services/series-service.ts` - add new methods

### Phase 3: API
- [ ] Update `app/api/series/route.ts` - backlog support, watched filter
- [ ] Update `app/api/series/[id]/route.ts` - accept new fields
- [ ] Rename `app/api/series/[id]/mark-watched/` → `catch-up/` (reset missedPeriods)
- [ ] Create new `app/api/series/[id]/mark-watched/route.ts` (set isWatched: true)
- [ ] Create `app/api/series/[id]/update-progress/route.ts`
- [ ] Update `app/api/videos/[id]/convert-to-series/route.ts` - backlog option

### Phase 4: UI Components
- [ ] Update `components/video-form/schedule-selector.tsx` - add "No schedule" option
- [ ] Update `components/video-form/form-layout.tsx` - episode fields for series
- [ ] Update `components/videos/convert-to-series-modal.tsx` - backlog checkbox
- [ ] Update `components/series/series-edit-modal.tsx` - episode count fields
- [ ] Update `components/series/series-card.tsx` - progress display, new buttons, completion prompt
- [ ] Update `components/series/series-list.tsx` - pass new handlers

### Phase 5: Page & Hook
- [ ] Update `hooks/use-series.ts` - new actions, watched param
- [ ] Update `app/series/page.tsx` - tab navigation, backlog filter

### Phase 6: Database & Test
- [ ] Run migration
- [ ] Test all flows
- [ ] Final commit

---

## Key UI Details

### Tab Navigation
```
┌──────────┬─────────┐
│  Active  │ Watched │
└──────────┴─────────┘
```

### Status Filters (Active tab only)
```
[All (5)] [Behind (2)] [Caught Up (1)] [Backlog (2)]
```

### Series Card - Progress Display (in JSON style)
```javascript
{
  "ID": 1,
  "PLATFORM": "netflix",
  "📅 SCHEDULE": "Weekly on Tuesday",  // or "No schedule" for backlog
  "PROGRESS": "5/24 Episodes",          // new field
  "MISSED": 2,                          // hidden for backlog
}
```

### Buttons
- Backlog series: `+1` (increment progress), `markWatched()`
- Recurring series: `catchUp()` (reset missed), `markWatched()`
- Watched series: `unmarkWatched()`

### Completion Prompts
- Backlog: When `watchedEpisodes >= totalEpisodes` after clicking +1
- Recurring: When series has ended (`endDate` passed or `isActive: false`) AND `missedPeriods === 0` after clicking `catchUp()`

---

## Branch
`feature/backlog-series`

## Related Files
- See implementation checklist above for full file list
