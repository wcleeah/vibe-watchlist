## Add video page
- the splitted section should be centered vertically
- tags added on the left side does not reflects on the right side preview
- when preview we dun need to show the id field
- on the left side
  - Add back the heading
  - Add tag input box should have a button for adding (but enter should still work)
  - Added tag now shows after the tag input box, move it to before (above) the tag input box
  - Url input box has a green border, no green, use the original color
- add toast for sucess creation
- add error json section below the if error
- there is a noticible delay between pasting the url and finish loading the preview and stuff, add a loading state, and simply display "loading..." (vertically and horizontally centered)
- Right now if the title is too long, there is no way i can view the full title, can we add a hover to view full title feature?

## Listing page

- View Analytics button can be removed, we have the nav bar
### Card design
- there is a strange border around the image, can you remove it
- add spacing between cards
- move id field to the top of the JSON block

### Action
- Add loading state for markWatched() and delete()

### The watched list
- Right now i cant view the list of watched video, needa make one
- And i need to be able to un-watched a video

## The preference pop up
- right now most of the button does not work:
  - Accent color, all option are the same, clicking any of them does nothing
  - Default Platform: what is the use of this?
  - Interface: again all of them has no effect
- make them has some effect, or remove them?

## Tag management view
- Add a page for managing tags

---

## Implementation Plan

Based on codebase research and requirements analysis, here's the comprehensive plan to implement the final push improvements. Tasks are organized by area with dependencies and effort estimates.

### Execution Strategy
- **Total Tasks**: 11 actionable items across 4 areas.
- **Estimated Effort**: Medium (2-3 days).
- **Order**: Start with quick UI tweaks, then add missing features.
- **Testing**: Run `bun run lint` and `bun run build` after each task. Test responsiveness.

### Task Breakdown

#### 1. Add Video Page Improvements (5 tasks)
- **Task 1.1**: Center split section vertically (Low effort - CSS only).
- **Task 1.2**: Sync tags between left and right sides (Low effort - prop passing).
- **Task 1.3**: Hide ID in preview, add heading on left, reposition tags above input (Low effort).
- **Task 1.4**: Improve tag input (add button, keep Enter) and remove green border from URL input (Low effort).
- **Task 1.5**: Add success toast, error JSON display, loading state, and hover tooltip for long titles (Medium effort).

#### 2. Listing Page Improvements (4 tasks)
- **Task 2.1**: Card design tweaks: remove image border, add spacing, move ID to top of JSON block (Low effort).
- **Task 2.2**: Remove View Analytics button from listing page (Trivial).
- **Task 2.3**: Add loading states for markWatched() and delete() actions (Low effort).
- **Task 2.4**: Implement watched video list and un-watch functionality (Medium effort).

#### 3. Preferences Popup Fixes (1 task)
- **Task 3.1**: Implement or remove non-functional preference options (accent color, interface toggles, default platform) (Medium-High effort).

#### 4. Tag Management View (1 task)
- **Task 4.1**: Create tag management view page (Medium effort).

### Timeline
- **Phase 1**: Add video page tasks (1.1-1.5) + listing tweaks (2.1-2.2).
- **Phase 2**: Watched list (2.4) + action loading (2.3).
- **Phase 3**: Preferences (3.1) + tag management (4.1).

### Status Tracking
- [x] Task 1.1: Completed - Added vertical centering to split layout in LayoutManager
- [x] Task 1.2: Completed - Synced tag state between form and preview by lifting state to Home component
- [x] Task 1.3: Completed - Added heading, repositioned tags above input, removed green border from URL input
- [x] Task 1.4: Completed - Added Add button to tag input, removed green border from URL input
- [x] Task 1.5: Completed - Added success toast, error JSON display, loading state with centered text, and hover tooltip for titles
- [x] Task 2.1: Completed - Moved ID to top of JSON, added card padding for spacing, removed border from no-thumbnail placeholder
- [x] Task 2.2: Completed - Removed View Analytics button and its import
- [x] Task 2.3: Completed - Added loading spinners and disabled states for markWatched and delete buttons
- [x] Task 2.4: Completed - Added Watched tab and page, implemented un-watch functionality in preview cards
- [ ] Task 3.1: Pending
- [ ] Task 4.1: Pending
