import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PHOTO_PROCESSING_QUEUE } from './queue.constants';
import { PhotoProcessor } from './processors/photo.processor';
import { PhotosModule } from '../photos/photos.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: PHOTO_PROCESSING_QUEUE }),
    forwardRef(() => PhotosModule),
  ],
  providers: [PhotoProcessor],
})
export class PhotoProcessingModule {}
