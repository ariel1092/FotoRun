import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  resourceType: string;
  bytes: number;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });

    this.logger.log(
      `Cloudinary initialized with cloud: ${this.configService.get<string>('CLOUDINARY_CLOUD_NAME')}`,
    );
  }

  /**
   * Upload image buffer to Cloudinary
   */
  async uploadImage(
    imageBuffer: Buffer,
    filename: string,
    folder: string = 'jerpro/photos',
  ): Promise<CloudinaryUploadResult> {
    try {
      this.logger.log(
        `Uploading image to Cloudinary: ${filename} to folder ${folder}`,
      );

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            public_id: this.sanitizeFilename(filename),
            overwrite: false,
            unique_filename: true,
          },
          (
            error: UploadApiErrorResponse | undefined,
            result: UploadApiResponse | undefined,
          ) => {
            if (error) {
              this.logger.error(
                `Error uploading to Cloudinary: ${error.message}`,
              );
              reject(new Error(error.message));
            } else if (result) {
              this.logger.log(
                `Image uploaded successfully. Public ID: ${result.public_id}, URL: ${result.secure_url}`,
              );
              resolve({
                publicId: result.public_id,
                url: result.url,
                secureUrl: result.secure_url,
                width: result.width,
                height: result.height,
                format: result.format,
                resourceType: result.resource_type,
                bytes: result.bytes,
              });
            } else {
              reject(new Error('Upload failed with no error or result'));
            }
          },
        );

        uploadStream.end(imageBuffer);
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error in uploadImage: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get URL with watermark transformation
   * For public preview (before purchase)
   * Creates a tiled watermark pattern across the entire image
   */
  getWatermarkedUrl(
    publicId: string,
    watermarkText: string = 'JERPRO',
  ): string {
    // Strategy: Use 5 watermarks with rotation to create diagonal tiling effect
    // This prevents overlap while covering the entire image
    return cloudinary.url(publicId, {
      transformation: [
        { width: 1600, crop: 'limit', quality: 'auto:good' },
        // Top left - rotated
        {
          overlay: 'text:Arial_45_bold:' + encodeURIComponent(watermarkText),
          color: 'white',
          opacity: 40,
          gravity: 'north_west',
          angle: -25,
          x: 120,
          y: 100,
        },
        // Top right - rotated
        {
          overlay: 'text:Arial_45_bold:' + encodeURIComponent(watermarkText),
          color: 'white',
          opacity: 40,
          gravity: 'north_east',
          angle: -25,
          x: 120,
          y: 100,
        },
        // Center - rotated
        {
          overlay: 'text:Arial_55_bold:' + encodeURIComponent(watermarkText),
          color: 'white',
          opacity: 45,
          gravity: 'center',
          angle: -25,
        },
        // Bottom left - rotated
        {
          overlay: 'text:Arial_45_bold:' + encodeURIComponent(watermarkText),
          color: 'white',
          opacity: 40,
          gravity: 'south_west',
          angle: -25,
          x: 120,
          y: 100,
        },
        // Bottom right - rotated
        {
          overlay: 'text:Arial_45_bold:' + encodeURIComponent(watermarkText),
          color: 'white',
          opacity: 40,
          gravity: 'south_east',
          angle: -25,
          x: 120,
          y: 100,
        },
      ],
      secure: true,
    });
  }

  /**
   * Get original URL without watermark
   * For photographer view and purchased downloads
   */
  getOriginalUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      transformation: [{ width: 2000, crop: 'limit', quality: 'auto:good' }],
      secure: true,
    });
  }

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl(
    publicId: string,
    width: number = 300,
    height: number = 300,
  ): string {
    return cloudinary.url(publicId, {
      transformation: [
        { width, height, crop: 'fill', gravity: 'auto' },
        { quality: 'auto:eco' },
      ],
      secure: true,
    });
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      this.logger.log(`Deleting image from Cloudinary: ${publicId}`);
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Image deleted successfully: ${publicId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error deleting image from Cloudinary: ${errorMessage}`,
      );
      throw error;
    }
  }

  /**
   * Delete multiple images from Cloudinary
   */
  async deleteMultipleImages(publicIds: string[]): Promise<void> {
    try {
      this.logger.log(`Deleting ${publicIds.length} images from Cloudinary`);
      await cloudinary.api.delete_resources(publicIds);
      this.logger.log(`Images deleted successfully`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting multiple images: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Sanitize filename for Cloudinary public_id
   */
  private sanitizeFilename(filename: string): string {
    // Remove extension and special characters
    return filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9-_]/g, '_') // Replace special chars with underscore
      .substring(0, 100); // Limit length
  }
}
