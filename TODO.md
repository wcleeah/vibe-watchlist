- [ ] unify suggestions passing, one big object, with two kind of suggestions
- [ ] add back platform suggestions form
- [ ] suggestion related should be handle in form, preview catd will use form context to get the values, including:
  - [ ] init form values
  - [ ] dropdown selections
- [ ] PreviewCard is used in listing, which breks since they don't have form
- [ ] move manual mode to preview card input
- [ ] remove tags state at page.tsx, can use form context directly
- [ ] move VideoFormData and the schema to a separate type file
- [ ] make sure onSubmit is using data in the form
- [x] add back loading page (already implemented)
- [ ] unify suggestions passing, one big object, with two kind of suggestions
- [ ] add back platform suggestions form (see commit f03bd51 for removed code)
- [ ] suggestion related should be handle in form, preview catd will use form context to get the values, including:
  - [ ] init form values
  - [ ] dropdown selections
- [ ] PreviewCard is used in listing, which breks since they don't have form
- [ ] move manual mode to preview card input
- [ ] remove tags state at page.tsx, can use form context directly
- [ ] move VideoFormData and the schema to a separate type file
- [ ] make sure onSubmit is using data in the form

## Detailed Implementation Plan

### Phase 1: Type Extraction (Foundation)
- [ ] Extract `videoSchema` and `VideoFormData` type from `app/page.tsx` to `types/form.ts`

### Phase 2: Suggestion System Unification
- [ ] Create unified suggestions object containing separate arrays for AI and platform suggestions
- [ ] Restore `PlatformSuggestions` component in `FormLayout` (integration removed in commit f03bd51)

### Phase 3: Component Decoupling & State Migration
- [ ] Extract new `VideoCardView` component for pure display logic compatible with list views
- [ ] Migrate `manualMode` state from `app/page.tsx` to `PreviewCard`
- [ ] Remove `selectedTags`/`setSelectedTags` from page, use form context in `FormLayout`

### Phase 4: Form Context Integration
- [ ] Move all suggestion handling to `FormLayout` with form initialization from selections
- [ ] Ensure PreviewCard reads display values from props (no form context)

### Phase 5: Submission & Validation
- [ ] Verify `onSubmit` reads from React Hook Form context, remove direct state dependencies

### Implementation Status
- [x] Branch created: `form-architecture-refactor`
- [x] Phase 1 completed: Types extracted to `types/form.ts`
- [x] Phase 2 completed: Unified suggestions system, restored platform suggestions form
- [x] Phase 3 completed: VideoCardView extracted, manualMode moved to PreviewCard, tags managed via form context
- [x] Phase 4 completed: Suggestion handling moved to FormLayout with form initialization
- [x] Phase 5 completed: onSubmit verified to use form data
- [ ] Testing and validation...
