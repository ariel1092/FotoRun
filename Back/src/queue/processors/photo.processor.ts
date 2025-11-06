import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger, Injectable } from '@nestjs/common';
import { PhotosService } from '../../photos/photos.service';
import { PHOTO_PROCESSING_QUEUE } from '../queue.module';

export interface PhotoProcessingJobData {
  photoId: string;
  photoUrl: string;
}

@Processor(PHOTO_PROCESSING_QUEUE)
@Injectable()
export class PhotoProcessor {
  private readonly logger = new Logger(PhotoProcessor.name);

  constructor(private readonly photosService: PhotosService) {}

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

      // Process photo (detect bibs)
      await this.photosService.processPhoto(photoId, photoUrl);

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

    const results = [];
    const errors = [];

    for (const photoData of photos) {
      try {
        await this.handlePhotoProcessing({
          ...job,
          data: photoData,
        } as Job<PhotoProcessingJobData>);
        results.push({ photoId: photoData.photoId, success: true });
      } catch (error) {
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

