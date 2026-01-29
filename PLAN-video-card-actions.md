# Video Card Action Buttons Redesign

## Problem Statement

1. **Crowded Action Column**: Up to 7 buttons stacked vertically making the UI cluttered
2. **Inconsistent Colors**: Each button uses hardcoded colors (purple, orange, indigo, blue, red) that don't match the app's monochromatic grayscale design system

## Solution

**Expandable Panel** layout with **Monochrome Semantic** colors using shadcn/ui Button component.

---

## Implementation Tasks

### Phase 1: Refactor Button Styling

- [x] Import shadcn/ui Button component
- [x] Replace custom button styles with Button variants
- [x] Update border colors to use theme tokens

### Phase 2: Implement Expandable Panel

- [x] Add `expanded` state to component
- [x] Categorize actions into primary and secondary
- [x] Create expand/collapse toggle button
- [x] Add animation for expanding secondary actions

### Phase 3: Testing & Cleanup

- [x] Verify all actions still work correctly
- [x] Test responsive behavior (mobile/desktop)
- [x] Ensure accessibility (focus states, ARIA)
- [x] Clean up unused styles

---

## Button Mapping

| Action | Variant | Category |
|--------|---------|----------|
| `watch()` | `default` | Primary |
| `markWatched()` / `unWatch()` | `outline` | Primary |
| `delete()` | `destructive` | Primary |
| `copyUrl()` | `ghost` | Secondary |
| `edit()` | `ghost` | Secondary |
| `toSeries()` | `ghost` | Secondary |
| `toPlaylist()` | `ghost` | Secondary |

---

## Files Modified

- `components/videos/video-card.tsx` - Main refactor

---

## Progress Log

- [ ] Phase 1 complete
- [ ] Phase 2 complete
- [ ] Phase 3 complete
- [ ] Final review and merge
