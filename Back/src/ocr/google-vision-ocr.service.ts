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

    // Extract only digits from the detected text
    const digits = result.text.replace(/\D/g, '');

    // Bib numbers are typically 1-5 digits
    const bibNumberMatch = digits.match(/\d{1,5}/);

    if (!bibNumberMatch) {
      this.logger.warn(`No valid bib number in text: "${result.text}"`);
      return null;
    }

    return bibNumberMatch[0];
  }
}
