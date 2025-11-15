import { Module, forwardRef, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PHOTO_PROCESSING_QUEUE } from './queue.constants';
import { PhotoProcessor } from './processors/photo.processor';
import { PhotosModule } from '../photos/photos.module';

@Module({
  imports: [
    // No registrar la cola aquí, ya está registrada en QueueModule
    // Solo importar BullModule para que el @Processor funcione
    BullModule.registerQueue({ name: PHOTO_PROCESSING_QUEUE }),
    forwardRef(() => PhotosModule),
  ],
  providers: [PhotoProcessor],
})
export class PhotoProcessingModule {
  private readonly logger = new Logger(PhotoProcessingModule.name);

  constructor() {
    this.logger.log('📦 PhotoProcessingModule is being initialized');
    this.logger.log(`📦 PhotoProcessor should be registered for queue: ${PHOTO_PROCESSING_QUEUE}`);
  }
}
