-- Migration: Extract single-series config to a dedicated series_config table
-- This creates a 1:1 table for single-mode series schedule/episode data,
-- migrates existing data, and drops the columns from the series table.

-- Step 1: Create the series_config table
CREATE TABLE IF NOT EXISTS "series_config" (
    "id" serial PRIMARY KEY NOT NULL,
    "series_id" integer NOT NULL,
    "schedule_type" text NOT NULL,
    "schedule_value" jsonb NOT NULL,
    "start_date" timestamp NOT NULL,
    "end_date" timestamp,
    "last_watched_at" timestamp,
    "next_episode_at" timestamp NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "episodes_aired" integer DEFAULT 0 NOT NULL,
    "episodes_remaining" integer,
    "episodes_watched" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

-- Step 2: Add constraints
ALTER TABLE "series_config"
    ADD CONSTRAINT "series_config_series_id_series_id_fk"
    FOREIGN KEY ("series_id") REFERENCES "series"("id")
    ON DELETE CASCADE;

ALTER TABLE "series_config"
    ADD CONSTRAINT "series_config_series_id_unique"
    UNIQUE ("series_id");

-- Step 3: Add indexes
CREATE INDEX IF NOT EXISTS "series_config_is_active_idx" ON "series_config" ("is_active");
CREATE INDEX IF NOT EXISTS "series_config_next_episode_idx" ON "series_config" ("next_episode_at");

-- Step 4: Migrate data — copy config from series rows where has_seasons = false
INSERT INTO "series_config" (
    "series_id",
    "schedule_type",
    "schedule_value",
    "start_date",
    "end_date",
    "last_watched_at",
    "next_episode_at",
    "is_active",
    "episodes_aired",
    "episodes_remaining",
    "episodes_watched",
    "created_at",
    "updated_at"
)
SELECT
    "id",
    "schedule_type",
    "schedule_value",
    "start_date",
    "end_date",
    "last_watched_at",
    "next_episode_at",
    "is_active",
    "episodes_aired",
    "episodes_remaining",
    "episodes_watched",
    "created_at",
    "updated_at"
FROM "series"
WHERE "has_seasons" = false;

-- Step 5: Drop the old columns and indexes from series table
DROP INDEX IF EXISTS "series_is_active_idx";
DROP INDEX IF EXISTS "series_next_episode_idx";

ALTER TABLE "series" DROP COLUMN IF EXISTS "schedule_type";
ALTER TABLE "series" DROP COLUMN IF EXISTS "schedule_value";
ALTER TABLE "series" DROP COLUMN IF EXISTS "start_date";
ALTER TABLE "series" DROP COLUMN IF EXISTS "end_date";
ALTER TABLE "series" DROP COLUMN IF EXISTS "last_watched_at";
ALTER TABLE "series" DROP COLUMN IF EXISTS "next_episode_at";
ALTER TABLE "series" DROP COLUMN IF EXISTS "is_active";
ALTER TABLE "series" DROP COLUMN IF EXISTS "episodes_aired";
ALTER TABLE "series" DROP COLUMN IF EXISTS "episodes_remaining";
ALTER TABLE "series" DROP COLUMN IF EXISTS "episodes_watched";
