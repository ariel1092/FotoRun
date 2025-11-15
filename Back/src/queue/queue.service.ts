import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PHOTO_PROCESSING_QUEUE } from './queue.constants';

export interface PhotoProcessingJobData {
  photoId: string;
  photoUrl: string;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(PHOTO_PROCESSING_QUEUE)
    private readonly photoProcessingQueue: Queue<PhotoProcessingJobData>,
  ) {}

  /**
   * Add photo processing job to queue
   */
  async addPhotoProcessingJob(
    photoId: string,
    photoUrl: string,
  ): Promise<void> {
    try {
      const job = await this.photoProcessingQueue.add('process-photo', {
        photoId,
        photoUrl,
      });

      const waitingCount = await this.photoProcessingQueue.getWaitingCount();
      const activeCount = await this.photoProcessingQueue.getActiveCount();
      const completedCount = await this.photoProcessingQueue.getCompletedCount();
      const failedCount = await this.photoProcessingQueue.getFailedCount();
      
      this.logger.log(
        `✅ Photo processing job added to queue: ${photoId} (Job ${job.id})`,
      );
      this.logger.log(
        `📊 Queue state - Waiting: ${waitingCount}, Active: ${activeCount}, Completed: ${completedCount}, Failed: ${failedCount}`,
      );
      
      // Log job details for debugging
      const jobState = await job.getState();
      this.logger.log(`📋 Job ${job.id} state: ${jobState}`);
    } catch (error) {
      this.logger.error(
        `Failed to add photo processing job to queue: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Add multiple photo processing jobs to queue
   */
  async addBatchPhotoProcessingJobs(
    photos: Array<{ photoId: string; photoUrl: string }>,
  ): Promise<void> {
    try {
      const jobs = photos.map((photo) =>
        this.photoProcessingQueue.add('process-photo', {
          photoId: photo.photoId,
          photoUrl: photo.photoUrl,
        }),
      );

      const createdJobs = await Promise.all(jobs);

      const waitingCount = await this.photoProcessingQueue.getWaitingCount();
      const activeCount = await this.photoProcessingQueue.getActiveCount();
      const completedCount = await this.photoProcessingQueue.getCompletedCount();
      const failedCount = await this.photoProcessingQueue.getFailedCount();

      this.logger.log(
        `✅ Added ${photos.length} photo processing jobs to queue`,
      );
      this.logger.log(
        `📊 Queue state - Waiting: ${waitingCount}, Active: ${activeCount}, Completed: ${completedCount}, Failed: ${failedCount}`,
      );
      
      // Log job IDs for debugging
      const jobIds = createdJobs.map(j => j.id).join(', ');
      this.logger.log(`📋 Created job IDs: ${jobIds}`);
      
      // Check job states
      for (const job of createdJobs) {
        const state = await job.getState();
        this.logger.log(`📋 Job ${job.id} state: ${state}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to add batch photo processing jobs to queue: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.photoProcessingQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress(),
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      state: await job.getState(),
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.photoProcessingQueue.getWaitingCount(),
      this.photoProcessingQueue.getActiveCount(),
      this.photoProcessingQueue.getCompletedCount(),
      this.photoProcessingQueue.getFailedCount(),
      this.photoProcessingQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }
}

