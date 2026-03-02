-- Migration: Add multi-season support to series
-- Adds has_seasons flag to series table and creates seasons table

-- Add has_seasons flag to series
ALTER TABLE "series" ADD COLUMN IF NOT EXISTS "has_seasons" boolean DEFAULT false NOT NULL;

-- Create seasons table
CREATE TABLE IF NOT EXISTS "seasons" (
    "id" serial PRIMARY KEY NOT NULL,
    "series_id" integer NOT NULL,
    "season_number" integer NOT NULL,
    "title" text,
    "url" text,
    "schedule_type" text NOT NULL,
    "schedule_value" jsonb NOT NULL,
    "start_date" timestamp NOT NULL,
    "end_date" timestamp,
    "last_watched_at" timestamp,
    "missed_periods" integer DEFAULT 0 NOT NULL,
    "next_episode_at" timestamp NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "total_episodes" integer,
    "watched_episodes" integer DEFAULT 0 NOT NULL,
    "is_watched" boolean DEFAULT false NOT NULL,
    "auto_advance_total_episodes" boolean DEFAULT false NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now(),
    CONSTRAINT "seasons_series_id_season_number_unique" UNIQUE("series_id", "season_number")
);

-- Add foreign key from seasons to series
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE CASCADE;

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS "seasons_series_id_idx" ON "seasons" ("series_id");
CREATE INDEX IF NOT EXISTS "seasons_is_active_idx" ON "seasons" ("is_active");
CREATE INDEX IF NOT EXISTS "seasons_next_episode_idx" ON "seasons" ("next_episode_at");
