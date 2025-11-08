import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import * as path from 'path';

@Injectable()
export class WatermarkService {
  private readonly logger = new Logger(WatermarkService.name);

  /**
   * Add watermark to image buffer
   * @param imageBuffer Original image buffer
   * @param watermarkText Text to use as watermark (e.g., "JERPRO")
   * @returns Buffer with watermarked image
   */
  async addWatermark(
    imageBuffer: Buffer,
    watermarkText: string = 'JERPRO',
  ): Promise<Buffer> {
    try {
      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();
      const { width, height } = metadata;

      // Calculate font size and spacing based on image size
      const fontSize = Math.floor(Math.min(width, height) / 15);
      const spacing = fontSize * 3;

      // Create SVG watermark with tiled text
      const watermarkSvg = this.createTiledWatermarkSvg(
        width,
        height,
        watermarkText,
        fontSize,
        spacing,
      );

      // Apply watermark
      const watermarkedBuffer = await sharp(imageBuffer)
        .composite([
          {
            input: Buffer.from(watermarkSvg),
            gravity: 'center',
          },
        ])
        .jpeg({ quality: 90 }) // High quality JPEG
        .toBuffer();

      this.logger.log(
        `Watermark added successfully. Original: ${imageBuffer.length} bytes, Watermarked: ${watermarkedBuffer.length} bytes`,
      );

      return watermarkedBuffer;
    } catch (error) {
      this.logger.error(`Error adding watermark: ${error.message}`, error.stack);
      // Return original buffer if watermarking fails
      return imageBuffer;
    }
  }

  /**
   * Create SVG with tiled watermark text
   */
  private createTiledWatermarkSvg(
    width: number,
    height: number,
    text: string,
    fontSize: number,
    spacing: number,
  ): string {
    const rows = Math.ceil(height / spacing) + 1;
    const cols = Math.ceil(width / spacing) + 1;

    let textElements = '';

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * spacing;
        const y = row * spacing;

        textElements += `
          <text
            x="${x}"
            y="${y}"
            font-family="Arial, sans-serif"
            font-size="${fontSize}"
            font-weight="bold"
            fill="white"
            fill-opacity="0.3"
            transform="rotate(-45 ${x} ${y})"
          >
            ${text}
          </text>
        `;
      }
    }

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        ${textElements}
      </svg>
    `;
  }

  /**
   * Check if file should have watermark based on extension
   */
  shouldAddWatermark(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  }
}
