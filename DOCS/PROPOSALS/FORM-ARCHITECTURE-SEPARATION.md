# Form Architecture Separation - Executable Plan

## Overview
Refactor the video submission form to separate URL input from form editing, implementing page-level loading to eliminate component remounting issues.

## Current Issues
- FormLayout handles both URL input and form fields, creating tight coupling
- Multiple async state updates cause FormLayout to remount 3+ times
- Platform detection triggers duplicate API calls
- Complex component tree with LayoutManager

## Proposed Solution

### Two-Mode Architecture
**Input Mode**: Dedicated URL input with immediate availability  
**Form Mode**: Metadata editing with full async loading

### Key Changes

#### 1. Extract UrlInputSection Component
- New component: `components/url-input-section.tsx`
- Contains: "Add New Video" heading (extracted from current page header) + URL input field
- Handles URL validation and initial parsing
- Triggers mode transition when URL is valid

#### 2. Refactor FormLayout
- Remove URL input functionality
- Remove platform detection logic
- Focus on metadata form fields and preview
- Receives platform data as props

#### 3. Page-Level State Management
- New state: `mode` ('input' | 'form')
- Platform detection moved to page level
- Full loading condition: wait for URL validation + AI metadata + platform detection

#### 4. Remove LayoutManager
- Inline simple layout logic in page.tsx
- Conditional rendering based on mode and loading state

#### 5. Mode Transitions
- Input → Form: When all async operations complete
- No loading spinner - direct transition
- Form only appears when fully stable

## Implementation Phases

### Phase 1: Extract Components ✅
- [x] Create UrlInputSection component with URL input and validation
- [x] Refactor FormLayout to remove URL/platform logic
- [x] Update FormLayout to accept platform/metadata as props
- [x] Update all import statements in affected files

### Phase 2: State Management
- [x] Create UrlInputSection component with URL input and validation
- [x] Refactor FormLayout to remove URL/platform logic
- [x] Update FormLayout to accept platform/metadata as props
- [x] Update all import statements in affected files

### Phase 2: State Management ✅
- [x] Add mode state ('input' | 'form') to page.tsx
- [x] Move platform detection logic to page level
- [x] Implement full loading condition for mode transition

### Phase 3: Layout Changes ✅
- [x] Remove LayoutManager from page.tsx
- [x] Implement conditional rendering based on mode
- [x] Update component props to pass required data

### Phase 4: Testing & Validation

## Benefits
- Immediate URL input availability
- Zero component remounts
- Clean separation of concerns
- Simplified component tree
- Stable form state

## Tradeoffs
- Form appears after full loading (slower UX)
- More components initially
- Page-level state complexity

## Files Modified
- `app/page.tsx` (major refactoring)
- `components/video-form/form-layout.tsx`
- `components/url-input-section.tsx` (new)

## Acceptance Criteria
- [ ] URL input appears immediately on page load
- [ ] Form transitions smoothly after all data loads
- [ ] No console errors or duplicate API calls
- [ ] Platform detection triggers exactly once
- [ ] Form state preserved across interactions

## Progress Tracking
Use this checklist to track implementation progress. Mark items complete as you work through each phase.
