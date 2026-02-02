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

### Task 2.1: Create `hooks/use-tags.ts`

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

### Task 2.2: Create `hooks/use-platforms-with-icons.ts`

- [x] Create `hooks/use-platforms-with-icons.ts`
- [x] Update `app/list/page.tsx` - Replace inline platform fetch
- [x] Update `app/playlists/page.tsx` - Replace inline platform fetch
- [x] Update `app/series/page.tsx` - Replace inline platform fetch

### Task 2.3: Create `hooks/use-tag-management.ts`

Extract tag selection logic used by form modals.

- [~] Deferred - tag selection logic handled directly in `useTags` hook via `addTag()`
- [~] Components now use `useTags().addTag()` for inline tag creation

### Task 2.4: Verify Changes

- [x] Run `bun run check`
- [x] Run `bun run build`

---

## Phase 3: Component Decomposition (Higher Risk, High Impact)

### Task 3.1: Decompose `analytics-dashboard.tsx` (843 lines -> ~150 lines)

Create new directory structure:
```
components/analytics/
├── analytics-dashboard.tsx        (main orchestrator, ~150 lines)
├── video-stats-section.tsx        (~150 lines)
├── usage-stats-section.tsx        (~200 lines)
├── stat-card.tsx                  (~40 lines)
├── platform-stats-list.tsx        (~50 lines)
├── tag-stats-list.tsx             (~50 lines)
├── recent-activity-list.tsx       (~60 lines)
├── usage-requests-table.tsx       (~80 lines)
├── operation-stats-grid.tsx       (~70 lines)
├── request-detail-modal.tsx       (~100 lines)
└── index.ts                       (exports)
```

- [ ] Create `lib/utils/format-utils.ts` with `formatNumber()`, `formatDate()`
- [ ] Create `hooks/use-watch-stats.ts`
- [ ] Create `hooks/use-usage-stats.ts`
- [ ] Create `components/analytics/stat-card.tsx`
- [ ] Create `components/analytics/platform-stats-list.tsx`
- [ ] Create `components/analytics/tag-stats-list.tsx`
- [ ] Create `components/analytics/recent-activity-list.tsx`
- [ ] Create `components/analytics/video-stats-section.tsx`
- [ ] Create `components/analytics/usage-requests-table.tsx`
- [ ] Create `components/analytics/operation-stats-grid.tsx`
- [ ] Create `components/analytics/request-detail-modal.tsx`
- [ ] Create `components/analytics/usage-stats-section.tsx`
- [ ] Refactor `components/analytics-dashboard.tsx` to orchestrator
- [ ] Create `components/analytics/index.ts`

### Task 3.2: Decompose `form-layout.tsx` (697 lines -> ~250 lines)

- [ ] Create `hooks/use-series-submission.ts`
- [ ] Create `hooks/use-playlist-management.ts`
- [ ] Create `components/video-form/playlist-preview-card.tsx`
- [ ] Create `components/video-form/series-schedule-section.tsx`
- [ ] Create `components/video-form/form-action-buttons.tsx`
- [ ] Create `components/video-form/form-error.tsx`
- [ ] Refactor `components/video-form/form-layout.tsx`

### Task 3.3: Decompose `schedule-selector.tsx` (384 lines -> ~150 lines)

- [ ] Create `hooks/use-date-entry-management.ts`
- [ ] Create `components/video-form/day-of-week-selector.tsx`
- [ ] Create `components/video-form/interval-input.tsx`
- [ ] Create `components/video-form/date-entry-form.tsx`
- [ ] Create `components/video-form/date-entry-list.tsx`
- [ ] Create `components/video-form/schedule-info-banner.tsx`
- [ ] Refactor `components/video-form/schedule-selector.tsx`

### Task 3.4: Refactor `series-edit-modal.tsx` (495 lines -> ~200 lines)

- [ ] Create `components/series/episode-progress-section.tsx`
- [ ] Update to use `useTagManagement` hook
- [ ] Refactor `components/series/series-edit-modal.tsx`

### Task 3.5: Verify Changes

- [ ] Run `bun run check`
- [ ] Run `bun run build`

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
| Phase 2 | 0 | 2 | 8 | ~344 | ~240 |
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
- Commit: `abcb624` (Phase 2: Extract shared hooks for tags and platforms)
- Notes:
  - Created `hooks/use-tags.ts` (157 lines) - Full CRUD operations for tags
  - Created `hooks/use-platforms-with-icons.ts` (83 lines) - Platform fetching with icon resolution
  - Migrated 8 files to use the new hooks
  - Removed ~344 lines of duplicated fetching logic across components
  - Task 2.3 (use-tag-management.ts) deferred - inline tag creation handled via `useTags().addTag()`
  - Fixed optional tag color handling with fallback `#6b7280` in tags-manager
  - Build passes successfully with only pre-existing viewport metadata warnings

### Phase 3 Progress
- Started: [DATE]
- Completed: [DATE]
- Notes:

### Phase 4 Progress
- Started: [DATE]
- Completed: [DATE]
- Notes:
