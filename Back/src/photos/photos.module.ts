import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { PhotosController } from './photo.controller';
import { PhotosService } from './photo.service';
import { Photo } from './photo.entity';
import { Detection } from '../detection/entities/detection.entity';
import { RoboflowModule } from '../roboflow/roboflow.module';
import { DetectionModule } from '../detection/detection.module';
import { StorageService } from '../storage/storage.service';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { ImageEnhancementService } from '../image-processing/image-enhancement.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Photo, Detection]),
    MulterModule.register({
      storage: undefined, // Use memory storage instead of disk
    }),
    RoboflowModule,
    DetectionModule, // Import DetectionModule to use BibDetectionService
    QueueModule, // Import QueueModule to use QueueService
  ],
  controllers: [PhotosController],
  providers: [
    PhotosService,
    StorageService,
    ImageProcessingService,
    ImageEnhancementService,
  ],
  exports: [PhotosService, StorageService], // Export PhotosService for QueueModule
})
export class PhotosModule {}
