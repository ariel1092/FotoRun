import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetectionController } from './detection.controller';
import { DetectionService } from './detection.service';
import { Detection } from './entities/detection.entity';
import { RoboflowService } from '../roboflow/roboflow.service';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { ImageEnhancementService } from '../image-processing/image-enhancement.service';
import { OcrService } from '../ocr/ocr.service';
import { BibOCRService } from '../ocr/bib-ocr.service';
import { BibDetectionService } from './bib-detection.service';
import { StorageService } from '../storage/storage.service';
import { RunnersModule } from '../runners/runners.module';
import { RoboflowModule } from '../roboflow/roboflow.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Detection]),
    RunnersModule,
    RoboflowModule,
  ],
  controllers: [DetectionController],
  providers: [
    DetectionService,
    RoboflowService,
    ImageProcessingService,
    ImageEnhancementService,
    OcrService,
    BibOCRService,
    BibDetectionService,
    StorageService,
  ],
  exports: [BibDetectionService, DetectionService],
})
export class DetectionModule {}