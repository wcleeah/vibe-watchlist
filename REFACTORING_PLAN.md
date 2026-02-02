# Frontend Codebase Refactoring Plan

## Overview

This plan is organized into 4 phases, progressing from low-risk quick wins to more complex refactoring. Each phase builds upon the previous one.

| Phase | Description | Risk Level | Estimated Time |
|-------|-------------|------------|----------------|
| Phase 1 | Quick Wins - Delete unused code, extract utilities | Very Low | ~30 minutes |
| Phase 2 | Hook Extraction - Create shared hooks | Medium | ~1-2 hours |
| Phase 3 | Component Decomposition - Break up large components | Medium-High | ~3-4 hours |
| Phase 4 | Page-Level Refactoring - Shared layouts | Medium | ~1-2 hours |

---

## Phase 1: Quick Wins (Low Risk, High Impact) - COMPLETED

### Task 1.1: Delete Unused Files

| File to Delete | Lines | Reason | Status |
|----------------|-------|--------|--------|
| `types/api.ts` | 50 | Zero imports anywhere | [x] |
| `types/ui.ts` | 32 | Zero imports anywhere | [x] |
| `hooks/use-video-form-state.ts` | 377 | Complete hook, never imported | [x] |
| `lib/utils/metadata-extractor.ts` | 48 | Never used, functionality in services | [x] |
| `lib/platforms/ai-detector.ts` | 246 | `aiDetector` singleton never imported | [x] |
| `app/tags/page.tsx` | 286 | Remove per user request | [x] |
| `components/videos/error-display.tsx` | 43 | Consolidated into shared | [x] |

**Total lines removed:** ~1,082 lines

### Task 1.2: Remove Debug Console Logs

| File | Line | Code to Remove | Status |
|------|------|----------------|--------|
| `lib/services/ai-service.ts` | 246 | `console.log("hehe")` | [x] |
| `app/page.tsx` | 194-196 | Debug useEffect for form errors | [x] |

### Task 1.3: Extract `getIconComponent` to Shared Utility

- [x] Create `lib/utils/icon-utils.ts` with shared function
- [x] Update `app/list/page.tsx` - Remove function, add import
- [x] Update `app/playlists/page.tsx` - Remove function, add import
- [x] Update `app/series/page.tsx` - Remove function, add import
- [x] Update `components/video-form/platform-badge.tsx` - Remove function, add import

### Task 1.4: Consolidate Error Display Components

- [x] Enhance `components/shared/error-display.tsx` to support `onToggleManual` with variants
- [x] Delete `components/videos/error-display.tsx`
- [x] Delete `ErrorDisplayProps` from `components/videos/types.ts`
- [x] Update `components/videos/video-card.tsx` to import from `@/components/shared`

### Task 1.5: Verify Changes

- [x] Run `bun run check` to verify no broken imports (pre-existing issues found, not from our changes)
- [x] Run `bun run build` to verify build passes
- [x] Fixed pre-existing bug: `platform-badge.tsx` invalid title prop on Icon

---

## Phase 2: Hook Extraction (Medium Risk, High Impact) - COMPLETED

### Task 2.1: Create `hooks/use-tags.ts` - COMPLETED

Centralize tag fetching used in 9 locations.

- [x] Create `hooks/use-tags.ts` with CRUD operations
- [x] Update `app/list/page.tsx` - Replace inline tag fetch
- [x] Update `app/playlists/page.tsx` - Replace inline tag fetch
- [x] Update `app/series/page.tsx` - Replace inline tag fetch
- [x] Update `components/playlists/playlist-edit-modal.tsx` - Replace inline tag fetch
- [x] Update `components/series/series-edit-modal.tsx` - Replace inline tag fetch
- [x] Update `components/video-form/form-layout.tsx` - Replace inline tag fetch
- [x] Update `components/video-form/video-edit-modal.tsx` - Replace inline tag fetch
- [x] Update `components/settings/tags-manager.tsx` - Replace inline tag fetch (full CRUD)

### Task 2.2: Create `hooks/use-platforms-with-icons.ts` - COMPLETED (superseded by 2.5)

- [x] Create `hooks/use-platforms-with-icons.ts`
- [x] Update `app/list/page.tsx` - Replace inline platform fetch
- [x] Update `app/playlists/page.tsx` - Replace inline platform fetch
- [x] Update `app/series/page.tsx` - Replace inline platform fetch

### Task 2.3: Create `hooks/use-tag-management.ts` - DEFERRED

Extract tag selection logic used by form modals.

- [~] Deferred - tag selection logic handled directly in `useTags` hook via `addTag()`
- [~] Components now use `useTags().addTag()` for inline tag creation

### Task 2.4: Verify Changes (Initial)

- [x] Run `bun run check`
- [x] Run `bun run build`

### Task 2.5: Unified `usePlatforms` Hook with Full CRUD - COMPLETED

Consolidate platform management similar to `useTags`. Merges and replaces Task 2.2.

#### 2.5.1: Create shared types
- [x] Create `types/platform.ts` with `PlatformConfig`, `NewPlatformData` types

#### 2.5.2: Create unified hook
- [x] Create `hooks/use-platforms.ts` with CRUD operations (add, update, delete, toggleEnabled)
- [x] Support `includeIcons` option (default: true) for `platformOptions` with resolved icons

#### 2.5.3: Migrate settings components (full CRUD)
- [x] Update `components/settings/platforms/platform-list.tsx` - Use hook for fetch, toggle, delete
- [x] Update `components/settings/platforms/platform-form.tsx` - Use hook for create/update

#### 2.5.4: Migrate video form components (create only)
- [x] Update `components/video-form/platform-creator.tsx` - Use hook for create
- [x] Update `components/video-form/form-layout.tsx` - Use hook for create

#### 2.5.5: Migrate list pages
- [x] Update `app/list/page.tsx` - Use `usePlatforms().platformOptions`
- [x] Update `app/playlists/page.tsx` - Use `usePlatforms().platformOptions`
- [x] Update `app/series/page.tsx` - Use `usePlatforms().platformOptions`

#### 2.5.6: Cleanup
- [x] Delete `hooks/use-platforms-with-icons.ts` (merged into unified hook)
- [x] Delete `app/api/platforms/create/route.ts` (duplicate endpoint)

#### 2.5.7: Verify Changes
- [x] Run `bun run build`
- [x] Commit changes

---

## Phase 3: Component Decomposition (Higher Risk, High Impact) - COMPLETED

### Task 3.1: Decompose `analytics-dashboard.tsx` (843 lines -> ~75 lines) - COMPLETED

Created new directory structure:
```
components/analytics/
├── analytics-dashboard.tsx        (main orchestrator, ~75 lines)
├── video-stats-section.tsx        (~70 lines)
├── usage-stats-section.tsx        (~90 lines)
├── stat-card.tsx                  (~50 lines)
├── platform-stats-list.tsx        (~45 lines)
├── tag-stats-list.tsx             (~45 lines)
├── recent-activity-list.tsx       (~55 lines)
├── usage-requests-table.tsx       (~65 lines)
├── operation-stats-grid.tsx       (~40 lines)
├── request-detail-modal.tsx       (~70 lines)
├── types.ts                       (shared types)
└── index.ts                       (exports)
```

- [x] Create `lib/utils/format-utils.ts` with `formatNumber()`, `formatDate()`, `formatDuration()`
- [x] Create `hooks/use-watch-stats.ts`
- [x] Create `hooks/use-usage-stats.ts`
- [x] Create `components/analytics/types.ts`
- [x] Create `components/analytics/stat-card.tsx`
- [x] Create `components/analytics/platform-stats-list.tsx`
- [x] Create `components/analytics/tag-stats-list.tsx`
- [x] Create `components/analytics/recent-activity-list.tsx`
- [x] Create `components/analytics/video-stats-section.tsx`
- [x] Create `components/analytics/usage-requests-table.tsx`
- [x] Create `components/analytics/operation-stats-grid.tsx`
- [x] Create `components/analytics/request-detail-modal.tsx`
- [x] Create `components/analytics/usage-stats-section.tsx`
- [x] Refactor `components/analytics-dashboard.tsx` to orchestrator
- [x] Create `components/analytics/index.ts`

### Task 3.2: Decompose `form-layout.tsx` (655 lines -> ~394 lines) - COMPLETED

- [x] Create `hooks/use-series-submission.ts` (108 lines)
- [x] Create `hooks/use-playlist-management.ts` (125 lines)
- [x] Create `components/video-form/playlist-preview-card.tsx` (54 lines)
- [x] Create `components/video-form/series-schedule-section.tsx` (121 lines)
- [x] Create `components/video-form/form-action-buttons.tsx` (95 lines)
- [x] Create `components/video-form/form-error.tsx` (14 lines)
- [x] Refactor `components/video-form/form-layout.tsx`

### Task 3.3: Decompose `schedule-selector.tsx` (384 lines -> ~168 lines) - COMPLETED

- [x] Create `hooks/use-date-entry-management.ts` (129 lines)
- [x] Create `components/video-form/day-of-week-selector.tsx` (51 lines)
- [x] Create `components/video-form/interval-input.tsx` (58 lines)
- [x] Create `components/video-form/date-entry-form.tsx` (69 lines)
- [x] Create `components/video-form/date-entry-list.tsx` (77 lines)
- [x] Create `components/video-form/schedule-info-banner.tsx` (55 lines)
- [x] Refactor `components/video-form/schedule-selector.tsx`

### Task 3.4: Refactor `series-edit-modal.tsx` (472 lines -> ~363 lines) - COMPLETED

- [x] Create `components/series/episode-progress-section.tsx` (70 lines)
- [x] Create `components/series/series-schedule-edit-section.tsx` (75 lines)
- [x] Create `components/series/tag-edit-section.tsx` (85 lines)
- [x] Refactor `components/series/series-edit-modal.tsx`

### Task 3.5: Verify Changes - COMPLETED

- [x] Run `bun run check`
- [x] Run `bun run build`

---

## Phase 4: Page-Level Refactoring (Medium Risk, Medium Impact)

### Task 4.1: Create `ListPageLayout` Shared Component

- [ ] Create `components/layout/list-page-layout.tsx`

### Task 4.2: Refactor List Pages

- [ ] Refactor `app/list/page.tsx` to use layout (~395 -> ~250 lines)
- [ ] Refactor `app/playlists/page.tsx` to use layout (~416 -> ~270 lines)
- [ ] Refactor `app/series/page.tsx` to use layout (~406 -> ~260 lines)

### Task 4.3: Final Verification

- [ ] Run `bun run check`
- [ ] Run `bun run build`
- [ ] Manual testing of all pages

---

## Summary Statistics

| Phase | Files Deleted | Files Created | Files Modified | Lines Removed | Lines Added (Net) |
|-------|---------------|---------------|----------------|---------------|-------------------|
| Phase 1 | 7 | 1 | 8 | ~1,100 | ~50 |
| Phase 2 | 3 | 2 | 11 | ~500 | ~300 |
| Phase 3 | 0 | 15 | 5 | ~1,500 | ~1,200 |
| Phase 4 | 0 | 1 | 3 | ~300 | ~200 |
| **Total** | **7** | **20** | **26** | **~3,300** | **~1,750** |

**Net reduction:** ~1,550 lines of code

---

## Progress Log

### Phase 1 Progress
- Started: 2026-02-01
- Completed: 2026-02-01
- Notes:
  - Deleted 7 unused files (~1,082 lines)
  - Created `lib/utils/icon-utils.ts` for shared icon utility
  - Consolidated error-display into shared component with variants
  - Fixed pre-existing bug in platform-badge.tsx (invalid title prop)
  - Build passes successfully

### Phase 2 Progress
- Started: 2026-02-02
- Completed: 2026-02-02
- Commits: 
  - `abcb624` (Phase 2: Extract shared hooks for tags and platforms)
  - `f41dbd0` (fix missing comma)
  - [pending] (Task 2.5: Unified usePlatforms hook)
- Notes:
  - Created `hooks/use-tags.ts` (157 lines) - Full CRUD operations for tags
  - Created `hooks/use-platforms-with-icons.ts` (83 lines) - Later superseded by unified hook
  - Migrated 8 files to use the new hooks
  - Task 2.3 (use-tag-management.ts) deferred - inline tag creation handled via `useTags().addTag()`
  - Task 2.5: Created unified `hooks/use-platforms.ts` (229 lines) with full CRUD
    - Replaced `use-platforms-with-icons.ts` 
    - Migrated platform-creator.tsx, form-layout.tsx to use hook
    - Migrated list/page.tsx, playlists/page.tsx, series/page.tsx
    - Deleted duplicate `/api/platforms/create` endpoint
  - Total removed: ~500+ lines of duplicated logic
  - Build passes successfully with only pre-existing viewport metadata warnings

### Phase 3 Progress
- Started: 2026-02-02
- Completed: 2026-02-02
- Commits:
  - `79436af` Task 3.1: decompose analytics-dashboard.tsx (843 -> ~75 lines)
  - `d53b151` Task 3.2: decompose form-layout.tsx (655 -> 394 lines)
  - `e9c33b8` Task 3.3: decompose schedule-selector.tsx (384 -> 168 lines)
  - `98c4eb1` Task 3.4: decompose series-edit-modal.tsx (472 -> 363 lines)
- Notes:
  - Created 5 new hooks: use-watch-stats, use-usage-stats, use-date-entry-management, use-series-submission, use-playlist-management
  - Created lib/utils/format-utils.ts with shared formatting functions
  - Decomposed analytics-dashboard into 12 focused components
  - Decomposed form-layout into 6 new components + hooks
  - Decomposed schedule-selector into 6 new components + hook
  - Decomposed series-edit-modal into 3 new components
  - Total line reductions:
    - analytics-dashboard.tsx: 843 -> 75 (91% reduction)
    - form-layout.tsx: 655 -> 394 (40% reduction)
    - schedule-selector.tsx: 384 -> 168 (56% reduction)
    - series-edit-modal.tsx: 472 -> 363 (23% reduction)
  - Build passes successfully

### Phase 4 Progress
- Started: [DATE]
- Completed: [DATE]
- Notes:
