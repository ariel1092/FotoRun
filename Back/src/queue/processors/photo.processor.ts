import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger, Injectable, Inject, forwardRef, OnModuleInit } from '@nestjs/common';
import { PhotosService } from '../../photos/photo.service';
import { PHOTO_PROCESSING_QUEUE } from '../queue.constants';

export interface PhotoProcessingJobData {
  photoId: string;
  photoUrl: string;
}

@Processor(PHOTO_PROCESSING_QUEUE)
@Injectable()
export class PhotoProcessor implements OnModuleInit {
  private readonly logger = new Logger(PhotoProcessor.name);

  constructor(
    @Inject(forwardRef(() => PhotosService))
    private readonly photosService: PhotosService,
  ) {
    try {
      this.logger.log('✅ PhotoProcessor initialized and ready to process jobs');
      this.logger.log(`📸 Listening for jobs on queue: ${PHOTO_PROCESSING_QUEUE}`);
      this.logger.log(`📸 PhotoProcessor constructor completed successfully`);
    } catch (error) {
      this.logger.error(`❌ Error initializing PhotoProcessor: ${error.message}`);
      this.logger.error(error.stack);
    }
  }

  /**
   * Lifecycle hook - called when module is initialized
   */
  onModuleInit() {
    this.logger.log('🔄 PhotoProcessor onModuleInit called');
    this.logger.log(`📸 PhotoProcessor is ready to process jobs from queue: ${PHOTO_PROCESSING_QUEUE}`);
  }

  @Process({
    name: 'process-photo',
    concurrency: 3, // Process 3 photos concurrently
  })
  async handlePhotoProcessing(job: Job<PhotoProcessingJobData>) {
    const { photoId, photoUrl } = job.data;

    this.logger.log(
      `Processing photo ${photoId} (Job ${job.id}, Attempt ${job.attemptsMade + 1}/${job.opts.attempts})`,
    );

    try {
      // Update photo status to processing
      await this.photosService.updateProcessingStatus(photoId, 'processing');

      // Process photo (detect bibs) - skip status update since we already did it
      await this.photosService.processPhoto(photoId, photoUrl, true);

      // Update photo status to completed
      await this.photosService.updateProcessingStatus(photoId, 'completed');

      this.logger.log(`Photo ${photoId} processed successfully (Job ${job.id})`);

      return { success: true, photoId };
    } catch (error) {
      this.logger.error(
        `Error processing photo ${photoId} (Job ${job.id}): ${error.message}`,
        error.stack,
      );

      // Update photo status to failed
      await this.photosService.updateProcessingStatus(photoId, 'failed').catch(
        (err) => {
          this.logger.error(
            `Failed to update photo status to failed: ${err.message}`,
          );
        },
      );

      // Re-throw error so Bull can retry
      throw error;
    }
  }

  @Process({
    name: 'process-photo-batch',
    concurrency: 2, // Process 2 batches concurrently
  })
  async handleBatchPhotoProcessing(job: Job<PhotoProcessingJobData[]>) {
    const photos = job.data;

    this.logger.log(
      `Processing batch of ${photos.length} photos (Job ${job.id})`,
    );

    const results: Array<{ photoId: string; success: boolean }> = [];
    const errors: Array<{ photoId: string; error: string }> = [];

    for (const photoData of photos) {
      try {
        // Process each photo individually
        await this.photosService.updateProcessingStatus(photoData.photoId, 'processing');
        await this.photosService.processPhoto(photoData.photoId, photoData.photoUrl, true);
        await this.photosService.updateProcessingStatus(photoData.photoId, 'completed');
        
        results.push({ photoId: photoData.photoId, success: true });
      } catch (error: any) {
        this.logger.error(
          `Error processing photo ${photoData.photoId}: ${error.message}`,
        );
        
        await this.photosService.updateProcessingStatus(photoData.photoId, 'failed', error.message).catch(
          (err) => {
            this.logger.error(
              `Failed to update photo status to failed: ${err.message}`,
            );
          },
        );
        
        errors.push({
          photoId: photoData.photoId,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Batch processing completed: ${results.length} succeeded, ${errors.length} failed`,
    );

    return { results, errors };
  }
}

