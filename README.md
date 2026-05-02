# Vibe Watchlist
Vibe Watchlist is a place where you can store all you good vibes, aka to-watch media content from different platform. It combines official platform APIs, HTML metadata scraping, and AI-assisted detection so you can add a URL once, choose the right content mode, keep everything organized in one place, and... enjoy the good vibes!

https://github.com/user-attachments/assets/631baf6a-51fb-40e2-85e1-f94f478c826c

## Feature Overview
- Track standalone videos with active and watched states.
- Import YouTube playlists and keep per-item progress in sync.
- Track ongoing or backlog series with schedule-aware episode progress.
- Save unreleased items as coming-soon reminders, then transform them into real tracked items later.
- Review watch stats and AI usage from the analytics dashboard.
- Tune AI prompts, models, cache, platforms, and tags from settings.

## Content mode
- `Video`: a single URL you want to watch or have already finished.
- `Playlist`: a YouTube playlist with item-level watch progress and metadata switching.
- `Series`: recurring content with single-series or multi-season tracking.
- `Coming Soon`: unreleased content with a release date and optional release time, attach a trailer and wait for the good vibes to come.

## Key Features
- One add flow with all four content modes: `Video`, `Series`, `Playlist`, and `Coming Soon`.
- URL validation and normalization, including canonical cleanup for YouTube links.
- Dynamic platform detection backed by database-driven platform configs.
- AI-assisted platform discovery for unknown but valid URLs.
- Metadata extraction pipeline that combines official YouTube and Twitch APIs, HTML/meta scraping, Google Custom Search, and OpenRouter structured-output prompts.
- Tagging, filtering, custom ordering, watched-state management, and metadata refresh actions.
- Playlist preview, import, sync, reordering, and progress tracking.
- Series tracking with daily, weekly, custom interval, fixed-date, and backlog scheduling modes.
- Multi-season series support with season-level progress actions.
- Coming-soon reminders that can be transformed into videos, playlists, or series when they are released.
- Analytics for video watch progress, platform/tag breakdowns, recent activity, and AI/API token usage.
- Settings UI for AI model selection, prompt editing, cache management, platform management/testing, and tag management.

## Tech Stack
- Runtime and package manager: Bun.
- Frontend (the hipster stack): Next.js, Tailwind, shadcn/ui, Radix UI.
- Backend: Next.js App Router with route handlers under `app/api`.
- Database: PostgreSQL with Drizzle ORM.
- AI and metadata: OpenRouter, Google Custom Search, YouTube Data API v3, Twitch Helix, Cheerio, and fallback HTML metadata extraction.
- Scheduling: Trigger.dev.
- Deployment: OpenNext.js for Cloudflare, Neon as Postgres provider.

## Getting Started
### 1. Install dependencies
```bash
bun install
```

### 2. Create your local environment file
```bash
cp .env.example .env.local
```
Fill in the variables listed in the environment section below.

### 3. Push database schema
```bash
bun x drizzle-kit push
```
Push the current Drizzle schema to your database. If you are starting from a fresh database, make sure the required preset platform data is also present.

### 4. Optionally seed persisted AI defaults
```bash
bun run scripts/seed-ai-config.ts
```
This step is optional. The app already has built-in AI defaults, but this script stores them in the `user_config` table so they are visible and editable immediately in Settings.

### 5. Start the development server
```bash
bun run dev
```
Open `http://localhost:3000`.

## Environment Variables
| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by the app and Drizzle. |
| `YOUTUBE_API_KEY` | Yes for YouTube features | Required for playlist preview/import/sync and official YouTube metadata fetches. |
| `OPENROUTER_API_KEY` | Yes for AI features | Required for AI platform detection, AI title suggestions, LangChain OpenRouter agent calls, and model loading in Settings. |
| `EXA_API_KEY` | Yes for AI metadata | Used by the Exa-backed `search_web` agent tool during metadata extraction. |
| `TWITCH_CLIENT_ID` | Optional | Required for official Twitch metadata lookups. |
| `TWITCH_CLIENT_SECRET` | Optional | Required for official Twitch metadata lookups. |
| `NEXT_PUBLIC_APP_URL` | Recommended | Sent to OpenRouter as the `HTTP-Referer`. Falls back to `http://localhost:3000`. |
| `DISABLE_METADATA_CACHE` | Optional | Set to `true` to bypass the metadata cache. |
| `METADATA_CACHE_TTL` | Optional | Metadata cache TTL in milliseconds. Defaults to 7 days. |
| `AI_ANALYSIS_TIMEOUT` | Optional | AI metadata timeout in milliseconds. Defaults to `15000`. |

## Deployment
This repo is configured for Cloudflare via OpenNext:
- `open-next.config.ts` uses the OpenNext Cloudflare adapter.
- `bun run preview` builds and previews the Cloudflare target.
- `bun run deploy` builds and deploys the Cloudflare target.

## CronJob
- Trigger.dev runs the `update-series-schedules` task once per day at
  midnight in `Asia/Hong_Kong`.
- The series page also exposes a manual `Run Update` action for the same schedule refresh flow.
