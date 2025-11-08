import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageAnnotatorClient } from '@google-cloud/vision';

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
        return;
      }

      this.client = new ImageAnnotatorClient({
        keyFilename: credentialsPath,
      });

      this.enabled = true;
      this.logger.log('Google Vision OCR initialized successfully');
    } catch (error: any) {
      this.logger.error(
        `Failed to initialize Google Vision OCR: ${error.message}`,
      );
      this.enabled = false;
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
      this.logger.warn('Google Vision OCR is not enabled');
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
    } catch (error) {
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

    // Filter to valid bib number lengths (1-4 digits)
    const validBibNumbers = digitSequences.filter(seq => {
      const num = parseInt(seq, 10);
      return seq.length >= 1 && seq.length <= 4 && num > 0;
    });

    if (validBibNumbers.length === 0) {
      this.logger.warn(`No valid bib number (1-4 digits) in text: "${result.text}"`);
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
}
