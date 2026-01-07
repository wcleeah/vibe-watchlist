-- Migration: Phase 8.5 - Database Migration & Foreign Key Setup
-- Run this SQL manually to complete the platform integration

BEGIN;

-- Step 1: Insert the "unknown" fallback platform
INSERT INTO platform_configs (
  platform_id, name, display_name, patterns, extractor,
  color, icon, enabled, is_preset, added_by, confidence_score, metadata
) VALUES (
  'unknown', 'unknown', 'Unknown Platform', ARRAY[''], 'ai',
  '#6b7280', 'Globe', true, true, 'system', 0.0,
  '{"description": "Ultimate fallback for unknown platforms", "isFallback": true}'
) ON CONFLICT (platform_id) DO NOTHING;

-- Step 2: Migrate existing videos to valid platforms
-- Set any videos with invalid platforms to 'unknown'
UPDATE videos SET platform = 'unknown'
WHERE platform NOT IN (
  SELECT platform_id FROM platform_configs WHERE enabled = true
);

-- Step 3: Remove the old enum constraint (if it exists)
DO $$
BEGIN
  -- Check if the old enum constraint exists and drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'videos'
    AND constraint_name LIKE '%platform%'
    AND constraint_type = 'CHECK'
  ) THEN
    ALTER TABLE videos DROP CONSTRAINT videos_platform_check;
    RAISE NOTICE 'Dropped old enum constraint videos_platform_check';
  END IF;
END $$;

-- Step 4: Add foreign key constraint
-- This ensures data integrity between videos and platform_configs
ALTER TABLE videos
ADD CONSTRAINT videos_platform_fkey
FOREIGN KEY (platform) REFERENCES platform_configs(platform_id)
ON DELETE RESTRICT;  -- Prevent deletion of platforms that have videos

COMMIT;

-- Verification queries (run these after migration)
-- SELECT COUNT(*) as total_videos FROM videos;
-- SELECT platform, COUNT(*) as count FROM videos GROUP BY platform ORDER BY count DESC;
-- SELECT platform_id, display_name FROM platform_configs WHERE enabled = true;