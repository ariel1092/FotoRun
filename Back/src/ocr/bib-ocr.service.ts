import { Injectable, Logger, Optional } from '@nestjs/common';
import { createWorker, Worker, PSM } from 'tesseract.js';
import { ImageEnhancementService } from '../image-processing/image-enhancement.service';
import { GoogleVisionOCRService } from './google-vision-ocr.service';

export interface BibOCRResult {
  bibNumber: string;
  confidence: number;
  rawText: string;
  alternatives?: string[];
  method?: 'tesseract' | 'google_vision';
}

export interface OCRConfig {
  lang?: string;
  whitelist?: string; // Characters to recognize (e.g., '0123456789')
  psm?: PSM; // Page segmentation mode
  oem?: number; // OCR Engine mode
}

@Injectable()
export class BibOCRService {
  private readonly logger = new Logger(BibOCRService.name);
  private worker: Worker | null = null;
  private readonly defaultConfig: OCRConfig = {
    lang: 'eng',
    whitelist: '0123456789',
    psm: PSM.SINGLE_WORD, // Treat the image as a single word (better for bib numbers)
    oem: 3, // Default OCR Engine Mode
  };

  constructor(
    private readonly imageEnhancementService: ImageEnhancementService,
    @Optional() private readonly googleVisionService?: GoogleVisionOCRService,
  ) {}

  /**
   * Initialize Tesseract worker
   */
  async initializeWorker(): Promise<Worker> {
    if (!this.worker) {
      this.logger.log('Initializing Tesseract OCR worker...');
      this.worker = await createWorker(this.defaultConfig.lang || 'eng');

      await this.worker.setParameters({
        tessedit_char_whitelist: this.defaultConfig.whitelist || '0123456789',
        tessedit_pageseg_mode: this.defaultConfig.psm || PSM.SINGLE_LINE,
        tessedit_ocr_engine_mode: this.defaultConfig.oem?.toString() || '3',
      });

      this.logger.log('Tesseract OCR worker initialized');
    }

    return this.worker;
  }

  /**
   * Read bib number from image region with multiple preprocessing attempts
   */
  async readBibNumber(regionBuffer: Buffer): Promise<BibOCRResult | null> {
    try {
      const worker = await this.initializeWorker();

      // First, upscale region if it's too small (improves OCR accuracy)
      const upscaledRegion = await this.imageEnhancementService.upscaleRegionForOCR(regionBuffer);

      // Try multiple preprocessing strategies
      const preprocessingStrategies = [
        // Strategy 1: High contrast
        {
          contrast: 2.5,
          brightness: 1.2,
          sharpen: true,
          normalize: true,
          grayscale: true,
        },
        // Strategy 2: Very high contrast
        {
          contrast: 3.0,
          brightness: 1.0,
          sharpen: true,
          normalize: true,
          grayscale: true,
        },
        // Strategy 3: High brightness
        {
          contrast: 2.0,
          brightness: 1.5,
          sharpen: true,
          normalize: true,
          grayscale: true,
        },
        // Strategy 4: Extreme sharpening
        {
          contrast: 2.0,
          brightness: 1.2,
          sharpen: true,
          normalize: true,
          grayscale: true,
        },
      ];

      let bestResult: {
        bibNumber: string;
        confidence: number;
        rawText: string;
      } | null = null;

      for (let i = 0; i < preprocessingStrategies.length; i++) {
        const strategy = preprocessingStrategies[i];

        // Enhance upscaled region with current strategy
        const enhancedRegion = await this.imageEnhancementService.enhanceImage(
          upscaledRegion,
          strategy,
        );

        // Perform OCR
        const {
          data: { text, confidence },
        } = await worker.recognize(enhancedRegion);

        // Clean and validate text
        const cleanedText = this.cleanText(text);
        const bibNumber = this.extractBibNumber(cleanedText);

        if (bibNumber && (!bestResult || confidence > bestResult.confidence)) {
          bestResult = { bibNumber, confidence, rawText: text };

          // If we got a high confidence result, no need to try more strategies
          if (confidence > 70) {
            this.logger.log(
              `OCR success on attempt ${i + 1}: "${bibNumber}" (confidence: ${confidence.toFixed(2)})`,
            );
            break;
          }
        }
      }

      // Always try Google Vision (it's more accurate than Tesseract for small text)
      if (this.googleVisionService?.isEnabled()) {
        this.logger.log('Trying Google Vision OCR...');

        const visionBibNumber =
          await this.googleVisionService.extractBibNumber(upscaledRegion);

        if (visionBibNumber) {
          this.logger.log(
            `Google Vision detected bib number: "${visionBibNumber}"`,
          );

          return {
            bibNumber: visionBibNumber,
            confidence: 0.85, // Google Vision is generally high confidence
            rawText: visionBibNumber,
            method: 'google_vision',
          };
        } else {
          this.logger.log('Google Vision failed, falling back to Tesseract result');
        }
      }

      if (!bestResult) {
        this.logger.warn(
          `No valid bib number found after ${preprocessingStrategies.length} attempts`,
        );
        return null;
      }

      // Get alternatives if confidence is low
      const alternatives =
        bestResult.confidence < 80
          ? this.generateAlternatives(bestResult.bibNumber)
          : undefined;

      this.logger.log(
        `OCR result: "${bestResult.bibNumber}" (confidence: ${bestResult.confidence.toFixed(2)}, raw: "${bestResult.rawText}")`,
      );

      return {
        bibNumber: bestResult.bibNumber,
        confidence: bestResult.confidence / 100, // Convert to 0-1 scale
        rawText: bestResult.rawText,
        alternatives,
        method: 'tesseract',
      };
    } catch (error) {
      this.logger.error(
        `Error reading bib number with OCR: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Clean OCR text
   */
  private cleanText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, '') // Remove whitespace
      .replace(/[^\d]/g, ''); // Keep only digits
  }

  /**
   * Extract bib number from text
   */
  private extractBibNumber(text: string): string | null {
    // Bib numbers are typically 1-4 digits
    const bibNumberMatch = text.match(/\d{1,4}/);
    return bibNumberMatch ? bibNumberMatch[0] : null;
  }

  /**
   * Generate alternative bib numbers for low confidence results
   */
  private generateAlternatives(bibNumber: string): string[] {
    const alternatives: string[] = [];
    const digits = bibNumber.split('');

    // Try single digit variations
    for (let i = 0; i < digits.length; i++) {
      for (let digit = 0; digit <= 9; digit++) {
        if (digits[i] !== digit.toString()) {
          const alt = [...digits];
          alt[i] = digit.toString();
          alternatives.push(alt.join(''));
        }
      }
    }

    return alternatives.slice(0, 5); // Return top 5 alternatives
  }

  /**
   * Terminate worker (cleanup)
   */
  async terminateWorker(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.logger.log('Tesseract OCR worker terminated');
    }
  }
}
