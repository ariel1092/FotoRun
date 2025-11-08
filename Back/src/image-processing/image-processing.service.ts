import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';  // ✅ Default import, NO namespace

export interface ImageRegion {
  buffer: Buffer;
  width: number;
  height: number;
}

export interface ImageAnalysis {
  mean_intensity: number;
  std_intensity: number;
  edge_density: number;
  area: number;
}

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  async extractRegion(
    imageBuffer: Buffer,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Promise<ImageRegion> {
    try {
      const region = await sharp(imageBuffer)
        .extract({
          left: Math.max(0, Math.round(x)),
          top: Math.max(0, Math.round(y)),
          width: Math.round(width),
          height: Math.round(height),
        })
        .toBuffer();

      return {
        buffer: region,
        width: Math.round(width),
        height: Math.round(height),
      };
    } catch (error) {
      this.logger.error('Error extrayendo región:', error.message);
      throw error;
    }
  }

  async analyzeRegion(regionBuffer: Buffer): Promise<ImageAnalysis> {
    try {
      const grayImage = sharp(regionBuffer).greyscale();
      
      const { data, info } = await grayImage.raw().toBuffer({ resolveWithObject: true });
      
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i];
      }
      const mean_intensity = sum / data.length;

      let variance = 0;
      for (let i = 0; i < data.length; i++) {
        variance += Math.pow(data[i] - mean_intensity, 2);
      }
      const std_intensity = Math.sqrt(variance / data.length);

      let edgeCount = 0;
      for (let i = 1; i < data.length; i++) {
        if (Math.abs(data[i] - data[i - 1]) > 30) {
          edgeCount++;
        }
      }
      const edge_density = edgeCount / data.length;

      const area = info.width * info.height;

      return {
        mean_intensity,
        std_intensity,
        edge_density,
        area,
      };
    } catch (error) {
      this.logger.error('Error analizando región:', error.message);
      throw error;
    }
  }

  async getImageDimensions(imageBuffer: Buffer): Promise<{ width: number; height: number }> {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width!,  // ✅ Non-null assertion porque siempre tiene width/height
      height: metadata.height!,
    };
  }

  /**
   * Expand bounding box coordinates by a percentage
   * Ensures the expanded box doesn't exceed image boundaries
   */
  expandBoundingBox(
    x: number,
    y: number,
    width: number,
    height: number,
    imageWidth: number,
    imageHeight: number,
    expansionPercent: number = 25, // Default 25% expansion
  ): { x: number; y: number; width: number; height: number } {
    // Calculate expansion in pixels
    const widthExpansion = (width * expansionPercent) / 100;
    const heightExpansion = (height * expansionPercent) / 100;

    // Expand in all directions
    let newX = x - widthExpansion / 2;
    let newY = y - heightExpansion / 2;
    let newWidth = width + widthExpansion;
    let newHeight = height + heightExpansion;

    // Ensure we don't exceed image boundaries
    if (newX < 0) {
      newWidth += newX; // Add the negative overflow to width
      newX = 0;
    }
    if (newY < 0) {
      newHeight += newY; // Add the negative overflow to height
      newY = 0;
    }
    if (newX + newWidth > imageWidth) {
      newWidth = imageWidth - newX;
    }
    if (newY + newHeight > imageHeight) {
      newHeight = imageHeight - newY;
    }

    this.logger.debug(
      `Expanded bounding box: (${x.toFixed(0)}, ${y.toFixed(0)}, ${width.toFixed(0)}x${height.toFixed(0)}) -> ` +
      `(${newX.toFixed(0)}, ${newY.toFixed(0)}, ${newWidth.toFixed(0)}x${newHeight.toFixed(0)})`,
    );

    return {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    };
  }
}