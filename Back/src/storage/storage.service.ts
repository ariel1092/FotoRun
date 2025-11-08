import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';

export interface UploadOptions {
  file: Buffer;
  filename: string;
  contentType: string;
  folder?: string;
  public?: boolean;
}

export interface UploadResult {
  url: string;
  path: string;
  publicUrl: string;
}

export interface ThumbnailOptions {
  width: number;
  height: number;
  quality?: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase: SupabaseClient;
  private readonly bucketName = 'race-images';
  private readonly defaultThumbnailWidth = 300;
  private readonly defaultThumbnailHeight = 300;
  private readonly defaultThumbnailQuality = 85;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in .env',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Upload a file to Supabase Storage
   */
  async upload(options: UploadOptions): Promise<UploadResult> {
    try {
      const {
        file,
        filename,
        contentType,
        folder = 'photos',
        public: isPublic = true,
      } = options;

      const filePath = `${folder}/${Date.now()}-${filename}`;

      this.logger.log(`Uploading file to ${this.bucketName}/${filePath}`);

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          contentType,
          upsert: false,
        });

      if (error) {
        this.logger.error(`Error uploading file: ${error.message}`);
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      const {
        data: { publicUrl },
      } = this.supabase.storage.from(this.bucketName).getPublicUrl(filePath);

      this.logger.log(`File uploaded successfully: ${publicUrl}`);

      return {
        url: filePath,
        path: filePath,
        publicUrl,
      };
    } catch (error) {
      this.logger.error(`Error in upload: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate and upload a thumbnail
   */
  async generateThumbnail(
    imageBuffer: Buffer,
    filename: string,
    options?: ThumbnailOptions,
  ): Promise<UploadResult> {
    try {
      const width = options?.width || this.defaultThumbnailWidth;
      const height = options?.height || this.defaultThumbnailHeight;
      const quality = options?.quality || this.defaultThumbnailQuality;

      this.logger.log(
        `Generating thumbnail for ${filename} (${width}x${height})`,
      );

      // Generate thumbnail using sharp
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality })
        .toBuffer();

      // Upload thumbnail
      const thumbnailName = `thumb_${filename.replace(/\.[^/.]+$/, '.jpg')}`;
      return await this.upload({
        file: thumbnailBuffer,
        filename: thumbnailName,
        contentType: 'image/jpeg',
        folder: 'thumbnails',
        public: true,
      });
    } catch (error) {
      this.logger.error(`Error generating thumbnail: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload a photo and generate its thumbnail
   */
  async uploadPhotoWithThumbnail(
    imageBuffer: Buffer,
    filename: string,
    contentType: string,
  ): Promise<{ photo: UploadResult; thumbnail: UploadResult }> {
    try {
      // Upload original photo
      const photo = await this.upload({
        file: imageBuffer,
        filename,
        contentType,
        folder: 'photos',
        public: true,
      });

      // Generate and upload thumbnail
      const thumbnail = await this.generateThumbnail(imageBuffer, filename);

      return { photo, thumbnail };
    } catch (error) {
      this.logger.error(
        `Error uploading photo with thumbnail: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Delete a file from Supabase Storage
   */
  async delete(filePath: string): Promise<void> {
    try {
      this.logger.log(`Deleting file: ${filePath}`);

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        this.logger.error(`Error deleting file: ${error.message}`);
        throw new Error(`Failed to delete file: ${error.message}`);
      }

      this.logger.log(`File deleted successfully: ${filePath}`);
    } catch (error) {
      this.logger.error(`Error in delete: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete multiple files from Supabase Storage
   */
  async deleteMultiple(filePaths: string[]): Promise<void> {
    try {
      this.logger.log(`Deleting ${filePaths.length} files`);

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove(filePaths);

      if (error) {
        this.logger.error(`Error deleting files: ${error.message}`);
        throw new Error(`Failed to delete files: ${error.message}`);
      }

      this.logger.log(`Files deleted successfully`);
    } catch (error) {
      this.logger.error(`Error in deleteMultiple: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(filePath: string): string {
    const {
      data: { publicUrl },
    } = this.supabase.storage.from(this.bucketName).getPublicUrl(filePath);
    return publicUrl;
  }

  /**
   * Legacy method for detection images (kept for backward compatibility)
   */
  async uploadDetectionImage(
    imageBuffer: Buffer,
    plateNumber: number,
    mimetype: string,
  ): Promise<string> {
    const result = await this.upload({
      file: imageBuffer,
      filename: `${plateNumber}.jpg`,
      contentType: mimetype,
      folder: 'detections',
      public: true,
    });
    return result.publicUrl;
  }

  /**
   * Legacy method for deleting images (kept for backward compatibility)
   */
  async deleteImage(imageUrl: string): Promise<void> {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `detections/${fileName}`;
    await this.delete(filePath);
  }
}