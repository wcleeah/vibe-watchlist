# Series/Recurring Reminders Feature Plan

## Overview

Add a **Series** feature that allows users to track episodic content with recurring schedules. Series are integrated into the existing add-video flow with a Video/Series mode toggle. Series live on a dedicated `/series` page and automatically track how many periods the user is behind. A Cloudflare Cron job updates series schedules daily.

## Key Behaviors

- **Unified add flow**: After URL paste, user toggles between Video/Series mode via segmented control
- **Platform default mode**: Each platform can have a default mode (video/series) with "Save as default" option
- **Series tracking**: Tracks `missedPeriods` (how many schedule periods behind)
- **Mark caught up**: Resets counter to 0, like marking a video as watched
- **Automatic updates**: Cloudflare Cron runs daily to increment missed periods
- **Timezone support**: User-configurable timezone (default: HKT)

---

## Implementation Progress

### Phase 1: Foundation
- [ ] Create feature branch
- [ ] Create plan document
- [ ] Update .env.example with CRON_SECRET

### Phase 2: Database Schema
- [ ] Add `defaultMode` column to `platform_configs` table
- [ ] Create `series` table
- [ ] Create `series_tags` junction table
- [ ] Add relations for series
- [ ] Generate and push migration

### Phase 3: Types
- [ ] Create `types/series.ts` with all series-related types

### Phase 4: Services
- [ ] Create `lib/services/schedule-service.ts`
- [ ] Create `lib/services/series-service.ts`

### Phase 5: API Endpoints
- [ ] `GET /api/series` - List series with filters
- [ ] `POST /api/series` - Create new series
- [ ] `GET /api/series/[id]` - Get single series
- [ ] `PUT /api/series/[id]` - Update series
- [ ] `DELETE /api/series/[id]` - Delete series
- [ ] `POST /api/series/[id]/mark-watched` - Mark caught up
- [ ] `POST /api/series/cron` - Cron handler
- [ ] Update `PUT /api/platforms/[id]` for defaultMode

### Phase 6: Form Components
- [ ] Create `components/video-form/mode-toggle.tsx`
- [ ] Create `components/video-form/schedule-selector.tsx`
- [ ] Create `components/video-form/date-picker-field.tsx`
- [ ] Modify `components/video-form/form-layout.tsx`

### Phase 7: Hooks
- [ ] Modify `hooks/use-video-form-state.ts`
- [ ] Create `hooks/use-series.ts`

### Phase 8: Series UI Components
- [ ] Create `components/series/series-card.tsx`
- [ ] Create `components/series/series-list.tsx`
- [ ] Create `components/series/series-edit-modal.tsx`

### Phase 9: Pages & Navigation
- [ ] Create `app/series/page.tsx`
- [ ] Modify `components/layout/navigation-tabs.tsx`

### Phase 10: Cloudflare Cron
- [ ] Create `custom-worker.ts`
- [ ] Update `wrangler.jsonc`

### Phase 11: Settings
- [ ] Add default mode to platform settings UI

---

## Database Schema

### Modify `platform_configs` table

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultMode` | text | `'video'` | `'video'` \| `'series'` |

### New `series` table

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | serial | - | Primary key |
| `url` | text | not null | URL to the series |
| `title` | text | null | Series name |
| `description` | text | null | Optional description |
| `platform` | text | not null | FK to platformConfigs |
| `thumbnailUrl` | text | null | Series thumbnail |
| `scheduleType` | text | not null | `'daily'` \| `'weekly'` \| `'custom'` |
| `scheduleValue` | jsonb | not null | Schedule config |
| `startDate` | date | not null | User-selected start date |
| `endDate` | date | null | Optional end date |
| `lastWatchedAt` | timestamp | null | Last "caught up" time |
| `missedPeriods` | integer | 0 | Periods behind |
| `nextEpisodeAt` | timestamp | not null | Next episode date |
| `isActive` | boolean | true | Series still running |
| `createdAt` | timestamp | now() | - |
| `updatedAt` | timestamp | now() | - |

### New `series_tags` junction table

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial | Primary key |
| `seriesId` | integer | FK to series (cascade delete) |
| `tagId` | integer | FK to tags (cascade delete) |

### Schedule value formats

```typescript
// Daily: every N days
{ "interval": 1 }   // daily
{ "interval": 3 }   // every 3 days

// Weekly: specific days
{ "days": ["friday"] }              // every Friday
{ "days": ["monday", "thursday"] }  // Mon & Thu

// Custom: every N days
{ "interval": 14 }  // bi-weekly
```

---

## API Endpoints

### Series CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/series` | List series with filters |
| `POST` | `/api/series` | Create new series |
| `GET` | `/api/series/[id]` | Get single series |
| `PUT` | `/api/series/[id]` | Update series |
| `DELETE` | `/api/series/[id]` | Delete series |
| `POST` | `/api/series/[id]/mark-watched` | Mark caught up (reset counter) |
| `POST` | `/api/series/cron` | Cron handler (secured) |

### Query params for `GET /api/series`

| Param | Values | Description |
|-------|--------|-------------|
| `status` | `'behind'` (default), `'caught-up'`, `'all'` | Filter by status |
| `platform` | platform ID | Filter by platform |
| `search` | string | Search title/description |

---

## File Summary

| Category | File | Action |
|----------|------|--------|
| **Schema** | `lib/db/schema.ts` | Modify |
| **Migration** | `drizzle/XXXX_add_series.sql` | New (generated) |
| **Types** | `types/series.ts` | New |
| **API** | `app/api/series/route.ts` | New |
| **API** | `app/api/series/[id]/route.ts` | New |
| **API** | `app/api/series/[id]/mark-watched/route.ts` | New |
| **API** | `app/api/series/cron/route.ts` | New |
| **API** | `app/api/platforms/[id]/route.ts` | Modify |
| **Services** | `lib/services/schedule-service.ts` | New |
| **Services** | `lib/services/series-service.ts` | New |
| **Hooks** | `hooks/use-video-form-state.ts` | Modify |
| **Hooks** | `hooks/use-series.ts` | New |
| **Components** | `components/video-form/form-layout.tsx` | Modify |
| **Components** | `components/video-form/mode-toggle.tsx` | New |
| **Components** | `components/video-form/schedule-selector.tsx` | New |
| **Components** | `components/video-form/date-picker-field.tsx` | New |
| **Components** | `components/series/series-card.tsx` | New |
| **Components** | `components/series/series-list.tsx` | New |
| **Components** | `components/series/series-edit-modal.tsx` | New |
| **Pages** | `app/series/page.tsx` | New |
| **Layout** | `components/layout/navigation-tabs.tsx` | Modify |
| **Cron** | `custom-worker.ts` | New |
| **Config** | `wrangler.jsonc` | Modify |
| **Env** | `.env.example` | Modify |

---

## Series Card Visual Design

```
┌──────────────────────────────────────────────────────┐
│ ┌──────────────┐                          [SERIES]  │
│ │              │  Title of the Series               │
│ │  Thumbnail   │  YouTube                           │
│ │              │  ────────────────────────────────  │
│ └──────────────┘  Schedule: Every Friday            │
│                   Status: 3 weeks behind            │
│                   Next: Feb 7, 2026                 │
│                   Last watched: Jan 10, 2026        │
│                   Ends: Mar 15, 2026                │
│                   ────────────────────────────────  │
│                   [Tag1] [Tag2]                     │
│  ─────────────────────────────────────────────────  │
│  [Watch]  [Mark Caught Up]  [Edit]  [Delete]        │
└──────────────────────────────────────────────────────┘
```

---

## Cloudflare Cron Setup

### Dashboard Actions Required

| Action | Location |
|--------|----------|
| Add cron trigger `0 16 * * *` (midnight HKT) | Workers → vibe-watchlist → Settings → Triggers |
| Add `CRON_SECRET` env var | Workers → vibe-watchlist → Settings → Variables |

---

## Environment Variables

New variables required:
- `CRON_SECRET` - Secret for authenticating cron requests

---

*Last updated: January 28, 2026*
