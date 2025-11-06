import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PhotoProcessor } from './processors/photo.processor';
import { QueueService } from './queue.service';
import { PhotosModule } from '../photos/photos.module';

export const PHOTO_PROCESSING_QUEUE = 'photo-processing';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB', 0),
        },
        defaultJobOptions: {
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 500, // Keep last 500 failed jobs
          attempts: 3, // Retry 3 times
          backoff: {
            type: 'exponential',
            delay: 2000, // Start with 2 seconds delay
          },
        },
      }),
    }),
    BullModule.registerQueue({
      name: PHOTO_PROCESSING_QUEUE,
    }),
    PhotosModule,
  ],
  providers: [PhotoProcessor, QueueService],
  exports: [BullModule, QueueService],
})
export class QueueModule {}

