-- Migration: Add OCR fields to detections table
-- Date: $(date)
-- Description: Add detectionConfidence, ocrConfidence, detectionMethod, and ocrMetadata columns

-- Add detectionConfidence column
ALTER TABLE detections
ADD COLUMN IF NOT EXISTS "detectionConfidence" FLOAT DEFAULT 0;

-- Add ocrConfidence column
ALTER TABLE detections
ADD COLUMN IF NOT EXISTS "ocrConfidence" FLOAT DEFAULT 0;

-- Add detectionMethod column
ALTER TABLE detections
ADD COLUMN IF NOT EXISTS "detectionMethod" VARCHAR(20) NULL;

-- Add ocrMetadata column
ALTER TABLE detections
ADD COLUMN IF NOT EXISTS "ocrMetadata" JSONB NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_detections_detection_method ON detections("detectionMethod");
CREATE INDEX IF NOT EXISTS idx_detections_confidence ON detections("confidence", "detectionConfidence", "ocrConfidence");

-- Update existing detections to have detectionConfidence = confidence
UPDATE detections
SET "detectionConfidence" = "confidence"
WHERE "detectionConfidence" = 0;

COMMENT ON COLUMN detections."detectionConfidence" IS 'Confidence score from Roboflow detection';
COMMENT ON COLUMN detections."ocrConfidence" IS 'Confidence score from OCR reading';
COMMENT ON COLUMN detections."detectionMethod" IS 'Method used: robofow_only, ocr_verified, or ocr_corrected';
COMMENT ON COLUMN detections."ocrMetadata" IS 'OCR metadata: raw text, alternatives, etc.';

