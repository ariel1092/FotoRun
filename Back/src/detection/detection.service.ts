import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Detection } from './entities/detection.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DetectionService {
  private readonly logger = new Logger(DetectionService.name);

  constructor(
    @InjectRepository(Detection)
    private detectionRepository: Repository<Detection>,
  ) {}

  async findAll(): Promise<Detection[]> {
    return this.detectionRepository.find({
      relations: ['photo'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByPhotoId(photoId: string): Promise<Detection[]> {
    return this.detectionRepository.find({
      where: { photoId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByBibNumber(bibNumber: string): Promise<Detection[]> {
    return this.detectionRepository.find({
      where: { bibNumber },
      relations: ['photo'],
      order: { createdAt: 'DESC' },
    });
  }

  async getStatistics() {
    const total = await this.detectionRepository.count();
    
    const byBibNumber = await this.detectionRepository
      .createQueryBuilder('detection')
      .select('detection.bibNumber', 'bibNumber')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(detection.confidence)', 'avgConfidence')
      .groupBy('detection.bibNumber')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      total_detections: total,
      by_bib_number: byBibNumber,
    };
  }
}
