-- Migration: Add backlog series support with episode tracking
-- Adds total_episodes, watched_episodes, and is_watched columns to series table

ALTER TABLE "series" ADD COLUMN "total_episodes" integer;
ALTER TABLE "series" ADD COLUMN "watched_episodes" integer DEFAULT 0 NOT NULL;
ALTER TABLE "series" ADD COLUMN "is_watched" boolean DEFAULT false NOT NULL;
