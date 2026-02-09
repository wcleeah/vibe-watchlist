# UI Refactor Phase 3: Cleanup & Enhancements

## Overview

This phase covers cleanup and enhancements following the Phase 2 card/list refactoring.

**Branch:** `ui-refactor-phase2` (continuing)

---

## Commit 1: MediaList Improvements

- [ ] `components/shared/media-list.tsx` - Add `keyExtractor` and `loadingSkeletonCount` props, export `MediaListProps`
- [ ] `components/shared/index.ts` - Add `MediaListProps` to exports
- [ ] `components/videos/video-list.tsx` - Pass `keyExtractor={(v) => v.id}`
- [ ] `components/series/series-list.tsx` - Pass `keyExtractor={(s) => s.id}`
- [ ] `components/playlists/playlist-list.tsx` - Pass `keyExtractor={(p) => p.id}`

---

## Commit 2: Page Consistency - Use List Components Fully

- [ ] `app/list/page.tsx` - Remove inline loading skeleton, pass `loading` and `emptyState` to VideoList
- [ ] `app/playlists/page.tsx` - Use PlaylistList component instead of inline rendering

---

## Commit 3: Lint Fixes - Auto-fixable & Simple

- [ ] `components/series/series-edit-modal.tsx` - `isNaN` → `Number.isNaN` (lines 221, 225)
- [ ] `components/video-form/mode-toggle.tsx` - Remove unused React import
- [ ] `components/url-input-section.tsx` - Prefix unused `isValid` param with underscore
- [ ] `components/settings/platforms/platform-form.tsx` - Add `type="button"`, fix backdrop a11y
- [ ] `components/ui/tag.tsx` - Add `type="button"`, add biome-ignore for dangerouslySetInnerHTML

---

## Commit 4: Lint Fixes - Proper Types (Remove `any`)

- [ ] `app/api/videos/route.ts` - Fix `any` types on lines 66, 253
- [ ] `app/settings/page.tsx` - Fix `any` types, import `PlatformConfig`
- [ ] `lib/utils/logger.ts` - Change `any[]` to `unknown[]`
- [ ] `lib/types/ai-metadata.ts` - Change `any[]` to `GoogleSearchResult[]`
- [ ] `types/series.ts` - Change `{}` to `Record<string, never>`

---

## Commit 5: Delete Unused Service Files

- [ ] Delete `lib/services/tag-service.ts` (unused, 88 lines)
- [ ] Delete `lib/services/video-service.ts` (unused, 137 lines)

---

## Final Verification

- [ ] `bun run build` - No build errors
- [ ] `bun run check` - 0 errors, minimal warnings
- [ ] `bun run fix` - Auto-format if needed

---

## Progress

| Commit | Status | Notes |
|--------|--------|-------|
| 1 - MediaList improvements | Pending | |
| 2 - Page consistency | Pending | |
| 3 - Lint fixes (simple) | Pending | |
| 4 - Lint fixes (types) | Pending | |
| 5 - Delete unused files | Pending | |

---

*Created: Phase 3 planning*
