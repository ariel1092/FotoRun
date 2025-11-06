import { Injectable, Logger } from '@nestjs/common';
import { RoboflowService, RoboflowDetection } from '../roboflow/roboflow.service';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { ImageEnhancementService } from '../image-processing/image-enhancement.service';
import { BibOCRService, BibOCRResult } from '../ocr/bib-ocr.service';

export interface EnhancedDetection {
  bibNumber: string;
  confidence: number;
  detectionConfidence: number; // Roboflow confidence
  ocrConfidence: number; // OCR confidence
  x: number;
  y: number;
  width: number;
  height: number;
  ocrResult?: BibOCRResult;
  metadata: {
    class_id: number;
    detection_id: string;
    method: 'robofow_only' | 'ocr_verified' | 'ocr_corrected';
  };
}

export interface DetectionOptions {
  minDetectionConfidence?: number;
  minOCRConfidence?: number;
  useOCR?: boolean;
  enhanceImage?: boolean;
  ocrFallback?: boolean; // Use OCR if Roboflow confidence is low
}

@Injectable()
export class BibDetectionService {
  private readonly logger = new Logger(BibDetectionService.name);
  private readonly defaultOptions: DetectionOptions = {
    minDetectionConfidence: 0.5,
    minOCRConfidence: 0.6,
    useOCR: true,
    enhanceImage: true,
    ocrFallback: true,
  };

  constructor(
    private readonly roboflowService: RoboflowService,
    private readonly imageProcessingService: ImageProcessingService,
    private readonly imageEnhancementService: ImageEnhancementService,
    private readonly bibOCRService: BibOCRService,
  ) {}

  /**
   * Detect bib numbers in image with enhanced processing
   */
  async detectBibNumbers(
    imageBuffer: Buffer,
    options: DetectionOptions = {},
  ): Promise<EnhancedDetection[]> {
    const opts = { ...this.defaultOptions, ...options };

    try {
      // Enhance image for better detection
      let processedImage = imageBuffer;
      if (opts.enhanceImage) {
        processedImage = await this.imageEnhancementService.enhanceImageForDetection(
          imageBuffer,
        );
      }

      // Convert to base64 for Roboflow
      const imageBase64 = processedImage.toString('base64');

      // Detect bib regions using Roboflow
      const roboflowResult = await this.roboflowService.detectBibsFromBase64(
        imageBase64,
      );

      // Filter by confidence
      const validDetections = this.roboflowService.filterByConfidence(
        roboflowResult.predictions,
        opts.minDetectionConfidence || 0.5,
      );

      this.logger.log(
        `Found ${validDetections.length} valid detections (from ${roboflowResult.predictions.length} total)`,
      );

      // Process each detection
      const enhancedDetections: EnhancedDetection[] = [];

      for (const detection of validDetections) {
        try {
          const enhanced = await this.processDetection(
            imageBuffer,
            detection,
            opts,
          );

          if (enhanced) {
            enhancedDetections.push(enhanced);
          }
        } catch (error) {
          this.logger.warn(
            `Error processing detection ${detection.detection_id}: ${error.message}`,
          );
          // Continue with next detection
        }
      }

      // Remove duplicates (same bib number detected multiple times)
      const uniqueDetections = this.deduplicateDetections(enhancedDetections);

      this.logger.log(
        `Processed ${uniqueDetections.length} unique bib numbers`,
      );

      return uniqueDetections;
    } catch (error) {
      this.logger.error(`Error detecting bib numbers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process a single detection
   */
  private async processDetection(
    imageBuffer: Buffer,
    detection: RoboflowDetection,
    options: DetectionOptions,
  ): Promise<EnhancedDetection | null> {
    // Extract region
    const region = await this.imageProcessingService.extractRegion(
      imageBuffer,
      detection.x,
      detection.y,
      detection.width,
      detection.height,
    );

    let bibNumber = detection.class;
    let ocrResult: BibOCRResult | null = null;
    let method: 'robofow_only' | 'ocr_verified' | 'ocr_corrected' = 'robofow_only';

    // Use OCR if enabled or if Roboflow confidence is low
    if (options.useOCR && (detection.confidence < 0.7 || options.ocrFallback)) {
      ocrResult = await this.bibOCRService.readBibNumber(region.buffer);

      if (ocrResult) {
        // If OCR confidence is high enough, use OCR result
        if (ocrResult.confidence >= (options.minOCRConfidence || 0.6)) {
          if (ocrResult.bibNumber !== bibNumber) {
            // OCR found different number
            method = 'ocr_corrected';
            bibNumber = ocrResult.bibNumber;
            this.logger.log(
              `OCR corrected bib number: ${detection.class} -> ${bibNumber}`,
            );
          } else {
            // OCR verified Roboflow result
            method = 'ocr_verified';
          }
        } else if (detection.confidence < 0.5) {
          // Low confidence from both, try OCR alternatives
          if (ocrResult.alternatives && ocrResult.alternatives.length > 0) {
            bibNumber = ocrResult.alternatives[0];
            method = 'ocr_corrected';
          }
        }
      }
    }

    // Validate bib number
    if (!this.isValidBibNumber(bibNumber)) {
      this.logger.warn(`Invalid bib number detected: "${bibNumber}"`);
      return null;
    }

    // Calculate combined confidence
    const combinedConfidence = this.calculateCombinedConfidence(
      detection.confidence,
      ocrResult?.confidence || 0,
      method,
    );

    return {
      bibNumber,
      confidence: combinedConfidence,
      detectionConfidence: detection.confidence,
      ocrConfidence: ocrResult?.confidence || 0,
      x: detection.x,
      y: detection.y,
      width: detection.width,
      height: detection.height,
      ocrResult: ocrResult || undefined,
      metadata: {
        class_id: detection.class_id,
        detection_id: detection.detection_id,
        method,
      },
    };
  }

  /**
   * Validate bib number format
   */
  private isValidBibNumber(bibNumber: string): boolean {
    // Bib numbers are typically 1-4 digits
    return /^\d{1,4}$/.test(bibNumber);
  }

  /**
   * Calculate combined confidence from detection and OCR
   */
  private calculateCombinedConfidence(
    detectionConfidence: number,
    ocrConfidence: number,
    method: string,
  ): number {
    if (method === 'robofow_only') {
      return detectionConfidence;
    } else if (method === 'ocr_verified') {
      // Both agree, boost confidence
      return Math.min(1.0, (detectionConfidence + ocrConfidence) / 2 + 0.1);
    } else {
      // OCR corrected, use weighted average
      return Math.min(1.0, detectionConfidence * 0.3 + ocrConfidence * 0.7);
    }
  }

  /**
   * Remove duplicate detections (same bib number)
   */
  private deduplicateDetections(
    detections: EnhancedDetection[],
  ): EnhancedDetection[] {
    const seen = new Map<string, EnhancedDetection>();

    for (const detection of detections) {
      const existing = seen.get(detection.bibNumber);

      if (!existing) {
        seen.set(detection.bibNumber, detection);
      } else {
        // Keep the one with higher confidence
        if (detection.confidence > existing.confidence) {
          seen.set(detection.bibNumber, detection);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Merge nearby detections (same bib number detected multiple times)
   */
  private mergeNearbyDetections(
    detections: EnhancedDetection[],
    threshold: number = 50, // pixels
  ): EnhancedDetection[] {
    const merged: EnhancedDetection[] = [];
    const processed = new Set<number>();

    for (let i = 0; i < detections.length; i++) {
      if (processed.has(i)) continue;

      const detection = detections[i];
      const nearby: EnhancedDetection[] = [detection];

      for (let j = i + 1; j < detections.length; j++) {
        if (processed.has(j)) continue;

        const other = detections[j];

        // Check if same bib number and nearby
        if (
          detection.bibNumber === other.bibNumber &&
          this.isNearby(detection, other, threshold)
        ) {
          nearby.push(other);
          processed.add(j);
        }
      }

      // Merge nearby detections
      if (nearby.length > 1) {
        const mergedDetection = this.mergeDetections(nearby);
        merged.push(mergedDetection);
      } else {
        merged.push(detection);
      }

      processed.add(i);
    }

    return merged;
  }

  /**
   * Check if two detections are nearby
   */
  private isNearby(
    a: EnhancedDetection,
    b: EnhancedDetection,
    threshold: number,
  ): boolean {
    const centerA = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
    const centerB = { x: b.x + b.width / 2, y: b.y + b.height / 2 };

    const distance = Math.sqrt(
      Math.pow(centerA.x - centerB.x, 2) + Math.pow(centerA.y - centerB.y, 2),
    );

    return distance < threshold;
  }

  /**
   * Merge multiple detections into one
   */
  private mergeDetections(
    detections: EnhancedDetection[],
  ): EnhancedDetection {
    // Use the detection with highest confidence as base
    const base = detections.reduce((best, current) =>
      current.confidence > best.confidence ? current : best,
    );

    // Calculate average bounding box
    const avgX =
      detections.reduce((sum, d) => sum + d.x, 0) / detections.length;
    const avgY =
      detections.reduce((sum, d) => sum + d.y, 0) / detections.length;
    const avgWidth =
      detections.reduce((sum, d) => sum + d.width, 0) / detections.length;
    const avgHeight =
      detections.reduce((sum, d) => sum + d.height, 0) / detections.length;

    // Calculate average confidences
    const avgDetectionConfidence =
      detections.reduce((sum, d) => sum + d.detectionConfidence, 0) /
      detections.length;
    const avgOCRConfidence =
      detections
        .filter((d) => d.ocrResult)
        .reduce((sum, d) => sum + (d.ocrConfidence || 0), 0) /
      Math.max(1, detections.filter((d) => d.ocrResult).length);

    return {
      ...base,
      x: avgX,
      y: avgY,
      width: avgWidth,
      height: avgHeight,
      confidence: Math.min(
        1.0,
        (avgDetectionConfidence + avgOCRConfidence) / 2 + 0.1,
      ),
      detectionConfidence: avgDetectionConfidence,
      ocrConfidence: avgOCRConfidence,
    };
  }
}

