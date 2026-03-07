-- Migration: Episode count redesign
-- Replaces: description, missedPeriods, totalEpisodes, watchedEpisodes, autoAdvanceTotalEpisodes
-- With: episodesAired, episodesRemaining, episodesWatched

-- ============================================================
-- SERIES TABLE
-- ============================================================

-- Step 1: Add new columns
ALTER TABLE "series" ADD COLUMN "episodes_aired" integer DEFAULT 0 NOT NULL;
ALTER TABLE "series" ADD COLUMN "episodes_remaining" integer;
ALTER TABLE "series" ADD COLUMN "episodes_watched" integer DEFAULT 0 NOT NULL;

-- Step 2: Migrate data
-- episodesAired = watchedEpisodes + missedPeriods (best approximation of total aired so far)
UPDATE "series" SET "episodes_aired" = COALESCE("watched_episodes", 0) + COALESCE("missed_periods", 0);

-- episodesWatched = old watchedEpisodes
UPDATE "series" SET "episodes_watched" = COALESCE("watched_episodes", 0);

-- episodesRemaining = totalEpisodes - episodesAired (only if totalEpisodes was set)
UPDATE "series" SET "episodes_remaining" = GREATEST("total_episodes" - "episodes_aired", 0)
WHERE "total_episodes" IS NOT NULL;

-- Step 3: Drop old columns
ALTER TABLE "series" DROP COLUMN IF EXISTS "description";
ALTER TABLE "series" DROP COLUMN IF EXISTS "missed_periods";
ALTER TABLE "series" DROP COLUMN IF EXISTS "total_episodes";
ALTER TABLE "series" DROP COLUMN IF EXISTS "watched_episodes";
ALTER TABLE "series" DROP COLUMN IF EXISTS "auto_advance_total_episodes";

-- ============================================================
-- SEASONS TABLE
-- ============================================================

-- Step 1: Add new columns
ALTER TABLE "seasons" ADD COLUMN "episodes_aired" integer DEFAULT 0 NOT NULL;
ALTER TABLE "seasons" ADD COLUMN "episodes_remaining" integer;
ALTER TABLE "seasons" ADD COLUMN "episodes_watched" integer DEFAULT 0 NOT NULL;

-- Step 2: Migrate data
UPDATE "seasons" SET "episodes_aired" = COALESCE("watched_episodes", 0) + COALESCE("missed_periods", 0);
UPDATE "seasons" SET "episodes_watched" = COALESCE("watched_episodes", 0);
UPDATE "seasons" SET "episodes_remaining" = GREATEST("total_episodes" - "episodes_aired", 0)
WHERE "total_episodes" IS NOT NULL;

-- Step 3: Drop old columns
ALTER TABLE "seasons" DROP COLUMN IF EXISTS "missed_periods";
ALTER TABLE "seasons" DROP COLUMN IF EXISTS "total_episodes";
ALTER TABLE "seasons" DROP COLUMN IF EXISTS "watched_episodes";
ALTER TABLE "seasons" DROP COLUMN IF EXISTS "auto_advance_total_episodes";
