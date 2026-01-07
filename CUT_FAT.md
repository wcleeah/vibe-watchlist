# CUT_FAT

## Problem Statement
After all these feature and bug fix and development, the code base has gone wild, and a bit unmanaged. Which produces a lot of duplicate codes and unused codes

## Details:
- I want a procedural plan and steps to identify:
  - unused code snippets / class / files
  - duplicate code
- I am thinking of a mark and sweep, like running a GC?
- Run it per feature code path, so add video flow, listing flow etc

## Analysis Findings (Phases 1-3 Complete)

### Inventory Results
- **Codebase Catalog**: ~120 source files (app/: 50+, components/: 40+, lib/: 30+). Key structure: Next.js App Router, service layers, UI components.
- **Unused Exports**: 61 modules with unused exports identified via ts-unused-exports. Many are API routes (e.g., DELETE methods), config files, and component exports.
- **Unused Dependencies**: 
  - Prod: @hookform/resolvers (false positive—used with zodResolver in forms).
  - Dev: @tailwindcss/postcss, tailwindcss, tw-animate-css (false positives—used in config/build), plus cleanup tools installed.
- **Code Duplicates**: None detected (jscpd with min 3 lines/30 tokens). Low duplication overall.

### Feature Boundaries Defined
Scoped to per-feature code paths for mark-and-sweep:
1. **Add Video Flow**: Entry: `app/components/video-form/`, `app/api/videos/route.ts` (POST), `lib/services/video-service.ts` (create).
2. **List Videos Flow**: Entry: `app/list/page.tsx`, `app/components/video-list/`, `app/api/videos/route.ts` (GET), `lib/services/video-service.ts` (getVideos).
3. **Watched Videos Flow**: Entry: `app/watched/page.tsx`, similar to list with filter.
4. **Settings Flow**: Entry: `app/settings/`, `app/api/config/`, `lib/preferences-context.tsx`.
5. **Tags Flow**: Entry: `app/tags/`, `app/api/tags/`, `lib/services/tag-service.ts`.
6. **Analytics Flow**: Entry: `app/analytics/`, `lib/analytics-context.tsx`.
7. **Platforms Flow**: Entry: `app/api/platforms/`, `lib/platforms/`.

### Suspects List (Unused Code Candidates)
Filtered from ts-unused-exports, categorized by feature. Verify usage before removal (e.g., runtime imports, feature flags).

#### Add Video Flow Suspects
- `components/video-form/index.ts`: UrlInput, TagInput, SubmitButton, MetadataSelector, MetadataOption, MetadataOptionCompact, ConfidenceIndicator, ConfidenceProgress, PlatformBadge, PlatformIcon.
- `lib/services/video-service.ts`: VideoService.

#### List Videos Flow Suspects
- `app/list/page.tsx`: default.
- `components/video-preview/index.ts`: MetadataDisplay, ThumbnailDisplay, TagDisplay, LoadingSkeleton, ErrorDisplay, VideoData, PreviewCardProps, LoadingSkeletonProps, ErrorDisplayProps.
- `lib/services/video-service.ts`: VideoService.

#### Watched Videos Flow Suspects
- `app/watched/page.tsx`: default.

#### Settings Flow Suspects
- `app/api/config/route.ts`: GET, PUT.

#### Tags Flow Suspects
- `app/api/tags/[id]/route.ts`: PUT, DELETE.
- `lib/services/tag-service.ts`: TagService.

#### Analytics Flow Suspects
- `lib/analytics-context.tsx`: WatchStats.

#### Cross-Feature/Global Suspects
- Config files: `drizzle.config.ts`, `next.config.ts`, `open-next.config.ts` (defaults—used by build).
- Schema: `drizzle/schema.ts`: videoPlatform, aiMetadataCache, etc.
- Services: `lib/services/ai-metadata-service.ts`, `lib/services/ai-service.ts`, etc.
- Types: `types/api.ts`, `types/form.ts`, etc.
- UI: `components/ui/*` variants (badgeVariants, buttonVariants).
- API routes: Many unused methods (e.g., DELETE in videos/[id], PUT in tags/[id]).
- Animations: `components/animations/index.tsx`: FadeIn, etc.

## Remaining Plan (Phases 4-5)

### Phase 4: Refactor & Verify (1-2 Days per Feature)
1. **Prioritize Suspects**: Remove low-risk (e.g., unused API methods) first.
2. **Remove**: Edit files, update imports.
3. **Verify**: `bun run lint`, `bun run build`, manual test (e.g., `bun run dev` and simulate flow).

### Phase 5: Global Cleanup & Monitoring (1 Week)
1. **Full Sweep**: Run on shared code (e.g., `lib/`, unused packages).
2. **Bundle Check**: Add `bunx webpack-bundle-analyzer` to scripts for size diffs.
3. **Documentation**: Update AGENTS.md with new conventions (e.g., "Run ts-unused-exports monthly").
4. **Monitoring**: Set up CI checks (e.g., fail build on new unused exports).
