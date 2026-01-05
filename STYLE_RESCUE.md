### Phase 6: UI Polish (PLANNED)
## ⏳ Card/Preview Design Overhaul: Improve visual design and layout
- right now add vid preview and list view card is not the same, lets unify them
  - except for border, in preview dun show the card border
- for the design overhaul
  - style
    - text color:
      - use greytone color and white primarily
      - use different text style instead to separate title / content
    - each item should be lean, not a huge block
    - i want a pure black background, white border
  - the structure of the card:
    - it should have 4 section
      - at the top. show the title. i think the top section of the current card looks good, we can use that
      - split three section horizontally for the bottom section. thumbnail | rest of the content | action buttons
      - thumbnail
        - the current size is good
      - rest of the content
        - tags, platform, ID etc
      - action buttons
        - it should be stack verically, each action is a button
          - like those small sticky note you used for bookmark on a actual book you know
        - mobile view put it at the bottom, horizontally
    - some minor details:
      - overflow support
      - hide url
      - vertically centered content
      - title currently shows some escaped text, not sure why
      - add delete button, and copy url button
## ⏳ Navbar Spacing: Optimize navigation layout and spacing
- the current navbar leave space in the left and right side, remove those space (but obviously keep so margin against the absolute border)
## ⏳ Add Video Page Spacing: Enhance form layout and spacing
- everything should be vertically center
- it should go full grep app! that means:
  - on page load, or no url is entered, only the header + the url input box
    - it should center on screen height not container height!
    - no need to show empty preview
    - no need to show tag input box now
  - after url is enter, it will split horizontally, the left side will be the url and tag inputs, the right side will be the preview
    - around 40 60 split for left and right
    - add a horizontal bar between both section
    - right now, it is showing the preview in a container, lets remove that
      - it should have a min height tho
    - the inner content of the left and right section should centered vertically
  - if user clear the url, back to only the header + the url input box
## Analytics page
- the current design is too cute and ... childish
- i want to make it align with the rest of site, the grep app style

---

## Comprehensive Styling Plan (Aligned with grep.app Style)

Based on research, grep.app features a minimal, code-focused, developer-oriented design with clean search interfaces, light themes, responsive layouts, and Tailwind CSS. This plan pivots the styling towards that direction: functional, clutter-free, with emphasis on usability, light backgrounds, neutral colors, and simple typography. Adapts Tailwind v4 and Shadcn/ui for consistency.

### General Best Practices Implementation
- **Theme Configuration**: Updated `globals.css` to light theme with neutral grays/whites (grep.app-inspired). Removed dark mode for now. CSS variables used. `components.json` already has `"cssVariables": true`.
- **Layout Patterns**: Centered, search-like layouts with responsive grids. Use Tailwind v4 container queries for breakpoints.
- **Component Structure**: Minimal components, utility-first. Follow Shadcn/ui for buttons/forms, but simplify to grep.app's clean style.
- **Dark Mode**: Optional light-first, add toggle if needed, but prioritize light theme like grep.app.
- **Performance**: Server components, optimize for fast loads. Avoid heavy animations.

### Card/Preview Design Overhaul
- **Unified Design**: Single `VideoCard` component, minimal borders (thin gray lines, no thick whites).
- **Structure Implementation**:
  - Top: Title in clean font, greytone hierarchy.
  - Bottom: Horizontal split - thumbnail, content (tags/ID), vertical buttons (small, functional).
  - Mobile: Horizontal button stack.
- **Styling Details**:
  - Lean: `max-w-sm`, white/light bg, subtle shadows.
  - Centering: `flex items-center`.
  - Overflow: `text-ellipsis`.
  - Fix escaped text.
  - Buttons: Shadcn/ui, but minimal styling.
- **Best Practices**: Tailwind utilities, CSS variables, responsive.

### Navbar Spacing Optimization
- **Remove Excess Margins**: Full-width, minimal padding, centered content like grep.app header.
- **Layout**: Simple nav bar with links, no clutter.
- **Integration**: Functional, developer-focused.

### Add Video Page Spacing Enhancement
- **Initial State**: Centered header + input, full-height like search pages.
- **Post-URL**: Horizontal split with subtle divider.
- **Responsive**: Container queries for mobile.
- **Centering**: `flex` for alignment.
- **Dynamic**: Toggle states smoothly.

### Analytics Page Redesign
- **Alignment**: Minimal, data-focused like grep.app's simplicity. Remove childish elements.
- **Styling**: Light bg, clean charts/data displays.
- **Updates**: Use consistent greys, functional UI.

### Implementation Steps
1. Update themes to light, neutral (grep.app-inspired).
2. Refactor components for minimalism.
3. Test on grep.app's responsive principles.
4. Lint and build after changes.

This plan achieves grep.app's clean, functional style for the video watchlist app.

