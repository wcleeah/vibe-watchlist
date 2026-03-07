# Series Changes Spec

## Original Requirements

Regarding series:
- if the series ended, and there are still episode unwatched, we should still show the behind tag with the ended tag in the series listing page
- column in db:
  - what is last_watched_at?
  - what is sort_order?
  - remove description column
- episode count design change:
  - all series should have the following fields for counting:
    - aired episodes: the count of episodes that has been aired before adding to the system. Default 0
    - rest of the episodes: the count of episodes that will be aired. Default undefined, if provided, end date must also be provided
    - total episodes: past episodes + rest of the episodes
    - watched episodes: the count of episodes that has been watched, must be smaller than aired episodes
    - not yet watched episodes: total - watched
    - to catch up episodes: aired - watched
  - cronjob increment aired episodes, and if rest of the episodes is provided, decrement it
  - remove misses_period, and related logic. use to catch up episodes instead.
  - user can only change aired episodes, rest of the episodes, and watched episodes in form. we will also only save these three fields to db 
  - the other field will be displayed, and calculate in runtime only.
  - make the +1 button in series listing page for backlog series available for non backlog series as well, it will increment watched episodes
  - catch up button makes the watched episodes the same as aired episodes
- regarding scheduling:
  - will changing the schedule changes the next episode at? if not it should
  - allow scheduling with time in a day, change the cron frequency to 5 min per run

---

## Implementation Plan

### Naming Convention

**Stored in DB (series + seasons tables):**
| Field | Column Name | Type | Default |
|---|---|---|---|
| Episodes aired | `episodesAired` | integer | 0 |
| Episodes remaining | `episodesRemaining` | integer | nullable |
| Episodes watched | `episodesWatched` | integer | 0 |

**Computed at runtime (enriched type):**
| Field | Derivation |
|---|---|
| `episodesTotal` | `episodesAired + (episodesRemaining ?? 0)` |
| `episodesUnwatched` | `episodesTotal - episodesWatched` |
| `episodesBehind` | `episodesAired - episodesWatched` |

**Validation:** `episodesWatched <= episodesAired`; if `episodesRemaining` provided, `endDate` required.

### Phase Tracker

- [x] **Phase 1** — Database schema & migration
  - Add `episodesAired`, `episodesRemaining` columns
  - Migrate data: `episodesAired = watchedEpisodes + missedPeriods`, `episodesRemaining = totalEpisodes - episodesAired`
  - Rename `watchedEpisodes` -> `episodesWatched`
  - Drop `description`, `missedPeriods`, `totalEpisodes`, `autoAdvanceTotalEpisodes`
  - Apply to both `series` and `seasons` tables
- [x] **Phase 2** — Types & computed fields
  - Update `types/series.ts` with new DB fields
  - Add `SeriesComputed` enriched type + `enrichSeries()` utility
  - Update `getSeriesStatus()` to return array (behind + ended can coexist)
  - Remove `missedPeriods`/`autoAdvanceTotalEpisodes` types and helpers
- [x] **Phase 3** — Service layer
  - `ScheduleService`: Remove `calculateMissedPeriods()`, add aired episode counting
  - `SeriesUpdateService`: Cron increments `episodesAired`, decrements `episodesRemaining`
  - `SeriesService` (client): Update payloads
- [x] **Phase 4** — API routes
  - Update all series + season CRUD for new fields
  - `catch-up`: Set `episodesWatched = episodesAired`
  - `update-progress`: Cap at `episodesAired`
  - Remove `description`/`autoAdvanceTotalEpisodes` from all routes
- [x] **Phase 5** — Scheduling enhancements
  - Add time-of-day to `scheduleValue` types (HKT)
  - Update `ScheduleSelector` with time picker
  - Update `calculateNextEpisodeDate()` for time support
  - Update `calculateNewEpisodesSinceDate()` for time-of-day awareness
  - Update `formatScheduleDisplay()` to show time-of-day
  - Change cron to `*/5 * * * *`
- [x] **Phase 6** — UI components
  - Multi-badge (behind + ended) in `series-card.tsx`
  - +1 button for all non-watched series
  - Updated progress display with computed fields
  - Edit modal / creation form field changes
  - Remove `description` from UI
- [x] **Phase 7** — Cleanup & verify
  - Grep for removed field references — all clean
  - `bun run check` — no new errors (pre-existing `.open-next/` issues only)
  - TypeScript `tsc --noEmit` — zero errors

---

## Series Config Extraction

Extract schedule/episode tracking fields from `series` table into a dedicated `series_config` table (1:1 relationship). Eliminates column duplication between `series` and `seasons`.

### Architecture

| Mode | Config source | On save |
|------|-------------|---------|
| **Single** (`hasSeasons=false`) | `series_config` row (1:1) | Write to `series_config` |
| **Seasons** (`hasSeasons=true`) | `seasons` rows (1:N) | Write to `seasons`, aggregate on read |

**Mode switching uses hard delete:**
- Single → Seasons: DELETE `series_config` row, create season rows
- Seasons → Single: DELETE all season rows, create `series_config` row

### Columns moved to `series_config`

`scheduleType`, `scheduleValue`, `startDate`, `endDate`, `lastWatchedAt`, `nextEpisodeAt`, `isActive`, `episodesAired`, `episodesRemaining`, `episodesWatched`

### `series` table retains only

`id`, `url`, `title`, `platform`, `thumbnailUrl`, `isWatched`, `hasSeasons`, `sortOrder`, `createdAt`, `updatedAt`

### Phase Tracker

- [x] **Phase 1** — DB schema (`lib/db/schema.ts`): slimmed `series`, new `seriesConfig` table
- [x] **Phase 2** — Migration SQL (`drizzle/0013_extract_series_config.sql`)
- [x] **Phase 3** — Types (`types/series.ts`): `SeriesConfigFields` interface, `Series extends DbSeries, SeriesConfigFields`
- [x] **Phase 4** — DB helpers (`lib/db/series-helpers.ts`): LEFT JOIN + `flattenSeriesRow()`
- [x] **Phase 5** — API routes: all 6 routes updated to read/write `seriesConfig`
- [x] **Phase 6** — Cron service (`series-update-service.ts`): queries `seriesConfig` INNER JOIN `series`
- [x] **Phase 7** — UI components: confirmed no changes needed (insulated by `SeriesWithTags` type)
- [x] **Phase 8** — Mode switching: hard delete logic in PUT handler for Single↔Seasons transitions
- [x] **Phase 9** — Mirror `drizzle/schema.ts`, type checks pass, biome checks pass (pre-existing issues only)

---

## Multi-Season +1 Button

When clicking +1 on a multi-season series, a season picker popover appears (since multi-season series have no `series_config` row — episode data lives in `seasons`). After selecting a season, the choice is cached in React state so subsequent clicks increment directly.

### Behavior

1. **No cached season** → Popover opens listing all seasons with progress (e.g., "Season 1 — 0/6")
2. **User selects a season** → Cache choice (React state only, clears on refresh), immediately increment
3. **Subsequent +1 clicks** → Use cached season, increment directly
4. **Button label** → Shows `+1 S{n}` when a season is cached
5. **Clear cache** → "Clear Season" action on the card resets to popover mode

### Files Changed

- `hooks/use-series.ts` — `CachedSeasonInfo` type, `seasonCache` Map state, `cacheSeasonForIncrement()`, `clearSeasonCache()`, `incrementSeasonProgress()`
- `components/series/series-card.tsx` — Multi-season +1 branching: popover season picker vs cached direct increment, clear cache action
- `components/series/series-list.tsx` — Props passthrough for season cache + increment callbacks
- `app/series/page.tsx` — Passes new season props to `SeriesList`
- `app/api/series/[id]/update-progress/route.ts` — Removed debug logging
- `scripts/migrate-hkt-dates.ts` — Replaced with stub (already-run migration, stale schema refs)

### Status

- [x] Hook logic (season cache + increment)
- [x] SeriesCard UI (popover, cached label, clear action)
- [x] Props wired through SeriesList → page.tsx
- [x] Build passes (`bun run build` — zero type errors)
- [ ] Manual browser testing

---

## Post-Refactor UX Fixes (March 2026)

Addressed the 10 follow-up regressions after `series_config` extraction and
multi-season +1 rollout.

### Fixed Issues

- [x] Edit modal season loading state (avoid flashing "No seasons" before fetch)
- [x] Single-series +1 UX feedback when already at aired cap
- [x] Always show TYPE metadata on card (`Single` / `Multi-Season`)
- [x] Remove PROGRESS metadata line from card metadata block
- [x] Restyle schedule time selector UI
- [x] Restyle Coming Soon time selector UI
- [x] Multi-season card schedule now reflects season-level schedule defaults
- [x] Season selector row in edit modal now includes schedule/time context
- [x] Widen edit modal for season-heavy editing
- [x] Add multi-season create flow (UI + API create route)
- [x] Add missing create-side episode fields (`aired`, `watched`, `remaining`)

### Files Updated

- `app/api/series/route.ts`
- `components/series/series-card.tsx`
- `components/series/series-edit-modal.tsx`
- `components/video-form/date-picker-field.tsx`
- `components/video-form/form-layout.tsx`
- `components/video-form/schedule-selector.tsx`
- `lib/db/series-helpers.ts`
- `types/series.ts`
