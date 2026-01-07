# Form Centralization with React Hook Form

## Overview
Centralize all video submission form logic in `page.tsx` using React Hook Form (RHF) with Zod validation. This replaces scattered state management with a single, validated form context.

## Objectives
- Single source of truth for form data (title, thumbnail, tags)
- Built-in validation and error handling
- Context-based state sharing (no prop drilling)
- Maintain existing UI/UX

## Current State
- Form logic split across page.tsx, FormLayout, PreviewCard
- Manual state management with useState/useEffect
- No centralized validation

## Target State
- RHF form in page.tsx with FormProvider
- Child components use useFormContext
- Zod schema for validation
- Form data drives submission

## Implementation Plan

### Phase 1: Setup RHF Infrastructure ✅
- [x] Define Zod schema for video form
- [x] Initialize useForm in page.tsx
- [x] Add FormProvider wrapper
- [x] Update URL input to display-only

### Phase 2: Integrate Manual Inputs ✅
- [x] Modify PreviewCard to use useFormContext for title/thumbnail
- [x] Update manual mode logic to work with form values
- [x] Ensure form updates when AI metadata changes

### Phase 3: Tag Management Integration ✅
- [x] Modify FormLayout to update form tags via context
- [x] Remove selectedTags prop passing
- [x] Test tag selection updates form state

### Phase 4: Submission & Validation ✅
- [x] Add form-level error display (currently only submitError)
- [x] Add field-level validation UI with Shadcn FormMessage in PreviewCard
- [x] Test end-to-end submission flow with validation

### Phase 5: Cleanup & Testing
- [ ] Remove unused props and state
- [ ] Update tests
- [ ] Performance verification

## Progress Updates

### 2025-01-07 10:00 - Initial Setup
- Created this proposal document
- Analyzed current codebase structure
- Defined implementation phases

### 2025-01-07 11:00 - Phase 1 Complete
- Added RHF imports and schema definition in page.tsx
- Initialized useForm with Zod resolver
- Added FormProvider wrapper
- Updated submission to use form.handleSubmit
- Integrated AI metadata auto-population of form
- Removed manual state variables, using form.watch instead
- Updated PreviewCard to use form.register for manual inputs
- Updated FormLayout to sync selectedTags with form context

### 2025-01-07 11:30 - Build Test Passed
- Compilation successful
- Core functionality working
- Ready for Phase 4: Enhanced validation UI

### 2025-01-07 12:00 - Phase 4 Complete
- Added FormField and FormMessage to PreviewCard manual inputs
- Field-level validation now displays Zod errors
- Form submission validates before API call
- All core RHF integration complete

</content>
<parameter name="filePath">/Users/leewingcheung/Documents/vibe-watchlist/DOCS/PROPOSALS/FORM-CENTRALIZATION.md