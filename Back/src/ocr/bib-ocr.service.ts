import { Injectable, Logger } from '@nestjs/common';
import { createWorker, Worker } from 'tesseract.js';
import { ImageEnhancementService } from '../image-processing/image-enhancement.service';

export interface BibOCRResult {
  bibNumber: string;
  confidence: number;
  rawText: string;
  alternatives?: string[];
}

export interface OCRConfig {
  lang?: string;
  whitelist?: string; // Characters to recognize (e.g., '0123456789')
  psm?: number; // Page segmentation mode
  oem?: number; // OCR Engine mode
}

@Injectable()
export class BibOCRService {
  private readonly logger = new Logger(BibOCRService.name);
  private worker: Worker | null = null;
  private readonly defaultConfig: OCRConfig = {
    lang: 'eng',
    whitelist: '0123456789',
    psm: 7, // Treat the image as a single text line
    oem: 3, // Default OCR Engine Mode
  };

  constructor(
    private readonly imageEnhancementService: ImageEnhancementService,
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
        tessedit_pageseg_mode: this.defaultConfig.psm?.toString() || '7',
        tessedit_ocr_engine_mode: this.defaultConfig.oem?.toString() || '3',
      });

      this.logger.log('Tesseract OCR worker initialized');
    }

    return this.worker;
  }

  /**
   * Read bib number from image region
   */
  async readBibNumber(
    regionBuffer: Buffer,
    config?: OCRConfig,
  ): Promise<BibOCRResult | null> {
    try {
      const worker = await this.initializeWorker();

      // Enhance region for better OCR
      const enhancedRegion = await this.imageEnhancementService.enhanceRegionForOCR(
        regionBuffer,
      );

      // Perform OCR
      const {
        data: { text, confidence },
      } = await worker.recognize(enhancedRegion);

      // Clean and validate text
      const cleanedText = this.cleanText(text);
      const bibNumber = this.extractBibNumber(cleanedText);

      if (!bibNumber) {
        this.logger.warn(`No valid bib number found in text: "${text}"`);
        return null;
      }

      // Get alternatives if confidence is low
      const alternatives = confidence < 0.8 ? this.generateAlternatives(bibNumber) : undefined;

      this.logger.log(
        `OCR result: "${bibNumber}" (confidence: ${confidence.toFixed(2)}, raw: "${text}")`,
      );

      return {
        bibNumber,
        confidence: confidence / 100, // Convert to 0-1 scale
        rawText: text,
        alternatives,
      };
    } catch (error) {
      this.logger.error(`Error reading bib number with OCR: ${error.message}`);
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

