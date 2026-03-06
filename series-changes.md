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

- [ ] **Phase 1** — Database schema & migration
  - Add `episodesAired`, `episodesRemaining` columns
  - Migrate data: `episodesAired = watchedEpisodes + missedPeriods`, `episodesRemaining = totalEpisodes - episodesAired`
  - Rename `watchedEpisodes` -> `episodesWatched`
  - Drop `description`, `missedPeriods`, `totalEpisodes`, `autoAdvanceTotalEpisodes`
  - Apply to both `series` and `seasons` tables
- [ ] **Phase 2** — Types & computed fields
  - Update `types/series.ts` with new DB fields
  - Add `SeriesComputed` enriched type + `enrichSeries()` utility
  - Update `getSeriesStatus()` to return array (behind + ended can coexist)
  - Remove `missedPeriods`/`autoAdvanceTotalEpisodes` types and helpers
- [ ] **Phase 3** — Service layer
  - `ScheduleService`: Remove `calculateMissedPeriods()`, add aired episode counting
  - `SeriesUpdateService`: Cron increments `episodesAired`, decrements `episodesRemaining`
  - `SeriesService` (client): Update payloads
- [ ] **Phase 4** — API routes
  - Update all series + season CRUD for new fields
  - `catch-up`: Set `episodesWatched = episodesAired`
  - `update-progress`: Cap at `episodesAired`
  - Remove `description`/`autoAdvanceTotalEpisodes` from all routes
- [ ] **Phase 5** — Scheduling enhancements
  - Add time-of-day to `scheduleValue` types (HKT)
  - Update `ScheduleSelector` with time picker
  - Update `calculateNextEpisodeDate()` for time support
  - Change cron to `*/5 * * * *`
- [ ] **Phase 6** — UI components
  - Multi-badge (behind + ended) in `series-card.tsx`
  - +1 button for all non-watched series
  - Updated progress display with computed fields
  - Edit modal / creation form field changes
  - Remove `description` from UI
- [ ] **Phase 7** — Cleanup & verify
  - Grep for removed field references
  - `bun run check`
  - `bun run db:generate`
