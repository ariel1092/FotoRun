import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import * as fs from 'fs';
import * as path from 'path';

export interface VisionOCRResult {
  text: string;
  confidence: number;
}

@Injectable()
export class GoogleVisionOCRService {
  private readonly logger = new Logger(GoogleVisionOCRService.name);
  private client: ImageAnnotatorClient | null = null;
  private enabled = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      const credentialsPath = this.configService.get<string>(
        'GOOGLE_VISION_CREDENTIALS_PATH',
      );

      if (!credentialsPath) {
        this.logger.warn(
          'GOOGLE_VISION_CREDENTIALS_PATH not configured. Google Vision OCR disabled.',
        );
        this.enabled = false;
        return;
      }

      // Resolve full path
      const fullPath = path.isAbsolute(credentialsPath)
        ? credentialsPath
        : path.resolve(process.cwd(), credentialsPath);

      // Check if file exists before creating client
      if (!fs.existsSync(fullPath)) {
        this.logger.warn(
          `Google Vision credentials file not found at: ${fullPath}. Google Vision OCR disabled.`,
        );
        this.enabled = false;
        this.client = null;
        return;
      }

      this.client = new ImageAnnotatorClient({
        keyFilename: fullPath,
      });

      this.enabled = true;
      this.logger.log('Google Vision OCR initialized successfully');
    } catch (error: any) {
      this.logger.warn(
        `Failed to initialize Google Vision OCR: ${error.message}. Google Vision OCR disabled.`,
      );
      this.enabled = false;
      this.client = null;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Extract text from image using Google Vision API
   */
  async extractText(imageBuffer: Buffer): Promise<VisionOCRResult | null> {
    if (!this.enabled || !this.client) {
      return null;
    }

    try {
      const [result] = await this.client.textDetection(imageBuffer);
      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        this.logger.warn('No text detected by Google Vision');
        return null;
      }

      // First annotation contains the full text
      const fullText = detections[0].description || '';

      // Extract confidence (Google Vision doesn't provide per-text confidence,
      // but we can use a heuristic based on detection quality)
      const confidence = detections.length > 1 ? 0.9 : 0.5;

      this.logger.log(
        `Google Vision detected text: "${fullText}" (confidence: ${confidence.toFixed(2)})`,
      );

      return {
        text: fullText.trim(),
        confidence,
      };
    } catch (error: any) {
      // Handle file not found errors gracefully (credentials missing)
      if (error.code === 'ENOENT' || error.message?.includes('no such file')) {
        this.logger.warn(
          'Google Vision credentials file not found. Disabling Google Vision OCR.',
        );
        this.enabled = false;
        this.client = null;
        return null;
      }
      
      this.logger.error(
        `Error calling Google Vision API: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Extract bib number specifically (optimized for digits)
   */
  async extractBibNumber(imageBuffer: Buffer): Promise<string | null> {
    const result = await this.extractText(imageBuffer);

    if (!result) {
      return null;
    }

    // Find all sequences of consecutive digits in the text
    const digitSequences = result.text.match(/\d+/g);

    if (!digitSequences || digitSequences.length === 0) {
      this.logger.warn(`No valid bib number in text: "${result.text}"`);
      return null;
    }

    // Filter to valid bib number lengths (3-5 digits) - más estricto que antes
    const validBibNumbers = digitSequences.filter(seq => {
      const num = parseInt(seq, 10);
      // Requerir mínimo 3 dígitos (más estricto)
      if (seq.length < 3 || seq.length > 5) return false;
      if (num < 10) return false; // Filtrar números muy pequeños
      // Filtrar años
      if (seq.length === 4 && num >= 2000 && num < 2100) return false;
      if (seq.length === 5 && num >= 20000 && num < 21000) return false;
      return true;
    });

    if (validBibNumbers.length === 0) {
      this.logger.warn(`No valid bib number (3-5 digits) in text: "${result.text}"`);
      return null;
    }

    // If multiple valid sequences found, prefer the longest one
    // (bib numbers are usually the most prominent digits)
    const bestMatch = validBibNumbers.reduce((best, current) => {
      if (current.length > best.length) return current;
      if (current.length === best.length) {
        // If same length, prefer the one that appears first (usually the bib)
        return result.text.indexOf(current) < result.text.indexOf(best) ? current : best;
      }
      return best;
    });

    this.logger.log(`Selected bib number "${bestMatch}" from candidates: ${validBibNumbers.join(', ')}`);

    return bestMatch;
  }

  /**
   * Extract ALL bib numbers from image (returns array of numbers)
   */
  async extractAllBibNumbers(imageBuffer: Buffer): Promise<string[]> {
    try {
      const result = await this.extractText(imageBuffer);

      if (!result) {
        return [];
      }

      // Find all sequences of consecutive digits in the text
      const digitSequences = result.text.match(/\d+/g);

      if (!digitSequences || digitSequences.length === 0) {
        return [];
      }

      // Filter to valid bib number lengths (3-5 digits) and remove duplicates
      // Más estricto: requiere mínimo 3 dígitos para evitar falsos positivos
      const validBibNumbers = Array.from(
        new Set(
          digitSequences.filter(seq => {
            const num = parseInt(seq, 10);
            // Requerir mínimo 3 dígitos
            if (seq.length < 3 || seq.length > 5) return false;
            if (num < 10) return false; // Filtrar números muy pequeños
            // Filter out years (2000-2099) and very small numbers that might be noise
            if (seq.length === 4 && num >= 2000 && num < 2100) return false;
            if (seq.length === 5 && num >= 20000 && num < 21000) return false;
            return true;
          })
        )
      );

      this.logger.log(
        `Google Vision found ${validBibNumbers.length} potential bib numbers: ${validBibNumbers.join(', ')}`,
      );

      return validBibNumbers;
    } catch (error: any) {
      // Handle errors gracefully - don't crash the app
      if (error.code === 'ENOENT' || error.message?.includes('no such file')) {
        this.logger.warn(
          'Google Vision credentials not found. Skipping Google Vision OCR.',
        );
        this.enabled = false;
        this.client = null;
        return [];
      }
      
      this.logger.warn(
        `Error extracting bib numbers with Google Vision: ${error.message}`,
      );
      return [];
    }
  }
}
