#!/usr/bin/env bun

/**
 * Migration Script: HKT Date Normalization
 *
 * ⚠️  ALREADY RUN — This script is kept for historical reference only.
 * The series table schema has since been refactored (columns moved to
 * series_config), so this script will NOT work against the current schema.
 *
 * Original purpose:
 * 1. Converts startDate and endDate from date type to timestamp
 * 2. Ensures all timestamps are properly normalized to HKT
 * 3. Updates nextEpisodeAt calculations to be consistent
 *
 * Run this script with: bun run scripts/migrate-hkt-dates.ts
 */

// This script references the pre-refactor schema and is no longer runnable.
// Keeping it as documentation of the migration that was performed.

export {};
console.log(
    'This migration has already been run. The series schema has since changed.',
);
