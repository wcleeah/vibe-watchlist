-- Add sort_order column for drag-and-drop reordering

-- Add sort_order to videos table
ALTER TABLE "videos" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;

-- Add sort_order to series table  
ALTER TABLE "series" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;

-- Add sort_order to playlists table
ALTER TABLE "playlists" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;
