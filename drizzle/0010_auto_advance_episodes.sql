-- Migration: Add auto_advance_total_episodes to series table
-- This column controls whether total_episodes should be automatically
-- incremented when new episodes are detected during series updates

ALTER TABLE "series" ADD COLUMN IF NOT EXISTS "auto_advance_total_episodes" boolean DEFAULT false NOT NULL;
