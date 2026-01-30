# Add Video Page Refactoring Plan

**Branch:** `refactor/add-video-page`  
**Date:** January 30, 2026  
**Goal:** Major architectural refactor of the add video page

## 🚨 Constraints
- Do NOT read `.env.local`
- Do NOT push any database changes

---

## Phases Overview

| Phase | Description | Status | Files Changed |
|-------|-------------|--------|---------------|
| Phase 1 | Cleanup & Foundation | ⏳ | 4 |
| Phase 2 | Custom Hooks | ⏳ | 6 |
| Phase 3 | Unified UI Components | ⏳ | 2 |
| Phase 4 | Decomposed Mode Forms | ⏳ | 5 |
| Phase 5 | Simplified Page Component | ⏳ | 1 |
| Phase 6 | Type Unification | ⏳ | 1 |

---

## Phase 1: Cleanup & Foundation

### Tasks
- [ ] **DELETE** `hooks/use-video-form-state.ts` (377 lines of dead code)
- [ ] **CREATE** `lib/constants/form.ts` - Magic number constants
  - `PLATFORM_CONFIDENCE_THRESHOLD = 0.3`
  - `MAX_TAG_SUGGESTIONS = 5`
  - `URL_DEBOUNCE_MS = 300`
- [ ] **FIX** `components/url-input-section.tsx:34` - Pass `value` prop correctly
  - Change `value={undefined}` to `value={value}`
- [ ] **REMOVE** console.log statements from `app/page.tsx`
  - Lines 159-163 (API response logging)
  - Lines 185-187 (form errors logging)

### Commit Message
```
Phase 1: Cleanup & Foundation

- Deleted unused use-video-form-state.ts hook
- Added constants file for magic numbers
- Fixed UrlInputSection value prop passthrough
- Removed console.log statements from production code
```

---

## Phase 2: Custom Hooks

### Tasks
- [ ] **CREATE** `hooks/use-debounce.ts` - Custom debounce utility
  - Input: callback, delay
  - Output: debounced function
  
- [ ] **UPDATE** `hooks/use-url-validation.ts` - Add debounce
  - Import custom useDebounce
  - Add 300ms debounce to `setUrl`
  - Update dependencies properly

- [ ] **UPDATE** `hooks/use-ai-metadata-fetching.ts` - Add AbortController
  - Add AbortController for fetch cleanup
  - Handle abort errors gracefully (don't set error state)
  - Add cleanup function to useEffect

- [ ] **CREATE** `hooks/use-platform-discovery.ts` - Extract from page
  - Move platform discovery logic from `page.tsx:62-94`
  - Include AbortController
  - Return: `{ suggestions, isProcessed, dismiss }`

- [ ] **CREATE** `hooks/use-tag-management.ts` - Extract from form-layout
  - Move tag management logic from `form-layout.tsx:129-246`
  - Handle tag fetching on mount
  - Return all tag-related state and actions

- [ ] **CREATE** `hooks/use-video-submission.ts` - Extract submission
  - Move video submission logic from `page.tsx:138-183`
  - Handle loading and error states
  - Return: `{ submit, isSubmitting, error, resetError }`

### Commit Message
```
Phase 2: Custom Hooks

- Created use-debounce.ts utility hook
- Added debounce to use-url-validation.ts (300ms)
- Added AbortController to use-ai-metadata-fetching.ts
- Created use-platform-discovery.ts hook
- Created use-tag-management.ts hook
- Created use-video-submission.ts hook

All async hooks now have proper cleanup and debouncing.
```

---

## Phase 3: Unified UI Components

### Tasks
- [ ] **CREATE** `components/shared/editable-media-card.tsx`
  - Unified preview/edit card component
  - Same structure in both modes
  - Title becomes editable input in place (when `isEditing`)
  - Thumbnail overlay with URL input in edit mode
  - "Edit"/"Done" toggle button in header
  - Consistent JSON-like metadata display

- [ ] **CREATE** `components/video-form/form-preview.tsx`
  - Connects EditableMediaCard to form context
  - Watches form fields and displays preview
  - Handles edit mode toggle
  - Replaces `PreviewCard` component

### Commit Message
```
Phase 3: Unified UI Components

- Created EditableMediaCard component for consistent preview/edit UI
- Title is editable inline with same positioning
- Thumbnail has overlay URL input in edit mode
- Edit/Done toggle button in header
- Created FormPreview component using EditableMediaCard
- Replaces the inconsistent VideoCardEditable + PreviewCard chain
```

---

## Phase 4: Decomposed Mode Forms

### Directory Structure
```
components/video-form/
├── modes/
│   ├── video-form.tsx      (Video mode form)
│   ├── series-form.tsx     (Series mode form)
│   └── playlist-form.tsx   (Playlist mode form)
├── sections/
│   └── schedule-section.tsx (Reusable schedule fields)
└── form-layout.tsx         (~80 lines orchestrator)
```

### Tasks
- [ ] **CREATE** `components/video-form/sections/schedule-section.tsx`
  - Reusable schedule selector component
  - Used by SeriesForm
  - Props: `scheduleType`, `scheduleValue`, `onChange`

- [ ] **CREATE** `components/video-form/modes/video-form.tsx`
  - Video-specific form content
  - Uses `useTagManagement` hook
  - Includes MetadataSelector
  - Includes TagInput
  - Submit button for video

- [ ] **CREATE** `components/video-form/modes/series-form.tsx`
  - Series-specific form content
  - Uses `useTagManagement` hook
  - Includes MetadataSelector
  - Uses ScheduleSection
  - Schedule fields (dates, episodes)
  - Submit button for series

- [ ] **CREATE** `components/video-form/modes/playlist-form.tsx`
  - Playlist-specific form content
  - Playlist preview fetching
  - Playlist import button
  - Simpler than video/series

- [ ] **REWRITE** `components/video-form/form-layout.tsx`
  - Reduce from 693 lines to ~80 lines
  - Only orchestrates mode switching
  - Renders appropriate ModeForm based on mode prop
  - No longer contains tag logic, submission logic, etc.

### Commit Message
```
Phase 4: Decomposed Mode Forms

- Created ScheduleSection component (reusable)
- Created VideoForm mode component
- Created SeriesForm mode component
- Created PlaylistForm mode component
- Rewrote FormLayout as ~80 line orchestrator
- Split 693 lines into 4 focused components
```

---

## Phase 5: Simplified Page Component

### Tasks
- [ ] **REWRITE** `app/page.tsx`
  - Use all extracted hooks
  - Remove inline useEffects for platform discovery
  - Remove inline submission logic
  - Use new FormPreview component
  - ~100 lines (down from 252)

### Commit Message
```
Phase 5: Simplified Page Component

- Rewrote page.tsx using extracted hooks
- Removed inline platform discovery logic
- Removed inline submission logic
- Integrated new FormPreview component
- Reduced from 252 to ~100 lines
- Page is now clean orchestrator
```

---

## Phase 6: Type Unification

### Tasks
- [ ] **CREATE** `lib/utils/video-transforms.ts`
  - Type conversion utilities
  - Form data to preview conversion
  - Video data to form data conversion

- [ ] **UPDATE** `types/form.ts` if needed
  - Ensure alignment with VideoFormData usage

### Commit Message
```
Phase 6: Type Unification

- Created video-transforms.ts utilities
- Added form data to preview conversion
- Added video to form data conversion
- Type alignment complete
```

---

## Deleted Files

| File | Lines | Reason |
|------|-------|--------|
| `hooks/use-video-form-state.ts` | 377 | Completely unused |
| `components/video-preview/preview-card.tsx` | 62 | Replaced by FormPreview |
| `components/videos/video-card-editable.tsx` | 165 | Replaced by EditableMediaCard |

---

## Created Files

| File | ~Lines | Purpose |
|------|--------|---------|
| `lib/constants/form.ts` | 10 | Magic number constants |
| `hooks/use-debounce.ts` | 20 | Debounce utility |
| `hooks/use-platform-discovery.ts` | 50 | Platform discovery hook |
| `hooks/use-tag-management.ts` | 100 | Tag management hook |
| `hooks/use-video-submission.ts` | 60 | Video submission hook |
| `components/shared/editable-media-card.tsx` | 150 | Unified edit/preview |
| `components/video-form/form-preview.tsx` | 40 | Form-connected preview |
| `components/video-form/sections/schedule-section.tsx` | 80 | Schedule UI component |
| `components/video-form/modes/video-form.tsx` | 120 | Video mode form |
| `components/video-form/modes/series-form.tsx` | 180 | Series mode form |
| `components/video-form/modes/playlist-form.tsx` | 120 | Playlist mode form |
| `lib/utils/video-transforms.ts` | 30 | Type conversions |

---

## Modified Files

| File | Changes |
|------|---------|
| `app/page.tsx` | Major simplification |
| `hooks/use-url-validation.ts` | Add debounce |
| `hooks/use-ai-metadata-fetching.ts` | Add AbortController |
| `components/url-input-section.tsx` | Fix value prop |
| `components/video-form/form-layout.tsx` | Slim to ~80 lines |
| `components/videos/video-card.tsx` | Remove editable logic |

---

## Impact Summary

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total Files | ~50 | ~60 | +10 net |
| page.tsx lines | 252 | ~100 | -60% |
| form-layout.tsx lines | 693 | ~80 | -88% |
| Dead code removed | - | ~600 | - |
| Async hooks with cleanup | 0 | 3 | +3 |
| Custom hooks | 2 | 7 | +5 |
| Components with >200 lines | 2 | 0 | -100% |

---

## Current Status

**Phase:** Not started  
**Current Commit:** TBD  
**Files Deleted:** 0/3  
**Files Created:** 0/13  
**Files Modified:** 0/6  

Last updated: 2026-01-30
