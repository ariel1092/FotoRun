-- Migration: Add thumbnailUrl column to photos table
-- Date: $(date)
-- Description: Add thumbnailUrl column to support Supabase Storage thumbnails

ALTER TABLE photos
ADD COLUMN IF NOT EXISTS "thumbnailUrl" VARCHAR(500) NULL;

-- Add index for faster thumbnail lookups (optional)
CREATE INDEX IF NOT EXISTS idx_photos_thumbnail_url ON photos("thumbnailUrl") WHERE "thumbnailUrl" IS NOT NULL;

COMMENT ON COLUMN photos."thumbnailUrl" IS 'URL of the thumbnail image in Supabase Storage';

