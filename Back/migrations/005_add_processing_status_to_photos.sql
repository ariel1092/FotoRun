-- Migration: Add processing status and error to photos table
-- Date: $(date)
-- Description: Add processingStatus and processingError columns to support async processing with queue

-- Add processingStatus column
ALTER TABLE photos
ADD COLUMN IF NOT EXISTS "processingStatus" VARCHAR(20) DEFAULT 'pending' CHECK ("processingStatus" IN ('pending', 'processing', 'completed', 'failed'));

-- Add processingError column
ALTER TABLE photos
ADD COLUMN IF NOT EXISTS "processingError" TEXT NULL;

-- Add index for faster queries by status
CREATE INDEX IF NOT EXISTS idx_photos_processing_status ON photos("processingStatus");

-- Add index for faster queries by status and isProcessed
CREATE INDEX IF NOT EXISTS idx_photos_status_processed ON photos("processingStatus", "isProcessed");

-- Update existing photos to have proper status
UPDATE photos
SET "processingStatus" = CASE 
  WHEN "isProcessed" = true THEN 'completed'
  ELSE 'pending'
END
WHERE "processingStatus" IS NULL;

COMMENT ON COLUMN photos."processingStatus" IS 'Processing status: pending, processing, completed, or failed';
COMMENT ON COLUMN photos."processingError" IS 'Error message if processing failed';

