import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

export interface ImageEnhancementOptions {
  contrast?: number; // 1.0 = no change, >1.0 = more contrast
  brightness?: number; // 1.0 = no change, >1.0 = brighter
  sharpen?: boolean; // Apply sharpening
  normalize?: boolean; // Normalize histogram
  grayscale?: boolean; // Convert to grayscale
  resize?: {
    width?: number;
    height?: number;
    maxDimension?: number; // Max width or height, maintain aspect ratio
  };
}

@Injectable()
export class ImageEnhancementService {
  private readonly logger = new Logger(ImageEnhancementService.name);

  /**
   * Enhance image for better detection
   */
  async enhanceImage(
    imageBuffer: Buffer,
    options: ImageEnhancementOptions = {},
  ): Promise<Buffer> {
    try {
      const {
        contrast = 1.2,
        brightness = 1.0,
        sharpen = true,
        normalize = true,
        grayscale = false,
        resize,
      } = options;

      let pipeline = sharp(imageBuffer);

      // Resize if needed (helps with detection performance)
      if (resize) {
        if (resize.maxDimension) {
          const metadata = await pipeline.metadata();
          const { width, height } = metadata;
          if (width && height) {
            if (width > resize.maxDimension || height > resize.maxDimension) {
              const ratio = Math.min(
                resize.maxDimension / width,
                resize.maxDimension / height,
              );
              pipeline = pipeline.resize(
                Math.round(width * ratio),
                Math.round(height * ratio),
              );
            }
          }
        } else if (resize.width || resize.height) {
          pipeline = pipeline.resize(resize.width, resize.height, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        }
      }

      // Convert to grayscale if needed (better for OCR)
      if (grayscale) {
        pipeline = pipeline.greyscale();
      }

      // Normalize histogram (improves contrast)
      if (normalize) {
        pipeline = pipeline.normalise();
      }

      // Adjust contrast
      if (contrast !== 1.0) {
        pipeline = pipeline.linear(contrast, -(128 * contrast) + 128);
      }

      // Adjust brightness
      if (brightness !== 1.0) {
        pipeline = pipeline.modulate({
          brightness: brightness,
        });
      }

      // Apply sharpening (improves text detection)
      if (sharpen) {
        pipeline = pipeline.sharpen({
          sigma: 1.0,
          flat: 1.0,
          jagged: 2.0,
        });
      }

      const enhancedBuffer = await pipeline.toBuffer();

      this.logger.log(
        `Image enhanced: ${imageBuffer.length} -> ${enhancedBuffer.length} bytes`,
      );

      return enhancedBuffer;
    } catch (error) {
      this.logger.error(`Error enhancing image: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enhance region for OCR (optimized for text reading)
   */
  async enhanceRegionForOCR(
    regionBuffer: Buffer,
    options: ImageEnhancementOptions = {},
  ): Promise<Buffer> {
    return this.enhanceImage(regionBuffer, {
      contrast: 1.5,
      brightness: 1.1,
      sharpen: true,
      normalize: true,
      grayscale: true,
      ...options,
    });
  }

  /**
   * Enhance full image for detection (optimized for object detection)
   */
  async enhanceImageForDetection(
    imageBuffer: Buffer,
    options: ImageEnhancementOptions = {},
  ): Promise<Buffer> {
    return this.enhanceImage(imageBuffer, {
      contrast: 1.2,
      brightness: 1.0,
      sharpen: true,
      normalize: true,
      grayscale: false,
      resize: { maxDimension: 1920 }, // Resize large images for better performance
      ...options,
    });
  }
}

