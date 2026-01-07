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

### Phase 1: Setup RHF Infrastructure
- [ ] Define Zod schema for video form
- [ ] Initialize useForm in page.tsx
- [ ] Add FormProvider wrapper
- [ ] Update URL input to display-only

### Phase 2: Integrate Manual Inputs
- [ ] Modify PreviewCard to use useFormContext for title/thumbnail
- [ ] Update manual mode logic to work with form values
- [ ] Ensure form updates when AI metadata changes

### Phase 3: Tag Management Integration
- [ ] Modify FormLayout to update form tags via context
- [ ] Remove selectedTags prop passing
- [ ] Test tag selection updates form state

### Phase 4: Submission & Validation
- [ ] Replace handleSubmit with form.handleSubmit
- [ ] Add form error display
- [ ] Test end-to-end submission flow

### Phase 5: Cleanup & Testing
- [ ] Remove old state management code
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

</content>
<parameter name="filePath">/Users/leewingcheung/Documents/vibe-watchlist/DOCS/PROPOSALS/FORM-CENTRALIZATION.md