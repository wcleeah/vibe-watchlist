-- Migration for Series Feature Support
-- This migration adds:
-- 1. default_mode column to platform_configs table
-- 2. series table for tracking recurring/episodic content
-- 3. series_tags junction table for series-tag relationships

-- Add default_mode column to platform_configs
ALTER TABLE "platform_configs" ADD COLUMN IF NOT EXISTS "default_mode" text DEFAULT 'video';

-- Create series table
CREATE TABLE IF NOT EXISTS "series" (
    "id" serial PRIMARY KEY NOT NULL,
    "url" text NOT NULL,
    "title" text,
    "description" text,
    "platform" text NOT NULL,
    "thumbnail_url" text,
    "schedule_type" text NOT NULL,
    "schedule_value" jsonb NOT NULL,
    "start_date" date NOT NULL,
    "end_date" date,
    "last_watched_at" timestamp,
    "missed_periods" integer DEFAULT 0 NOT NULL,
    "next_episode_at" timestamp NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

-- Add foreign key constraint for series.platform
DO $$ BEGIN
    ALTER TABLE "series" ADD CONSTRAINT "series_platform_fkey" 
    FOREIGN KEY ("platform") REFERENCES "platform_configs"("platform_id") 
    ON DELETE restrict ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes on series table
CREATE INDEX IF NOT EXISTS "series_is_active_idx" ON "series" ("is_active");
CREATE INDEX IF NOT EXISTS "series_next_episode_idx" ON "series" ("next_episode_at");

-- Create series_tags junction table
CREATE TABLE IF NOT EXISTS "series_tags" (
    "id" serial PRIMARY KEY NOT NULL,
    "series_id" integer NOT NULL,
    "tag_id" integer NOT NULL
);

-- Add foreign key constraints for series_tags
DO $$ BEGIN
    ALTER TABLE "series_tags" ADD CONSTRAINT "series_tags_series_id_series_id_fk" 
    FOREIGN KEY ("series_id") REFERENCES "series"("id") 
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "series_tags" ADD CONSTRAINT "series_tags_tag_id_tags_id_fk" 
    FOREIGN KEY ("tag_id") REFERENCES "tags"("id") 
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
