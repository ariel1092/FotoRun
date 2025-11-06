import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DetectionService } from './detection.service';
import { Detection } from './entities/detection.entity';

@Controller('detections')
@UseGuards(JwtAuthGuard)
export class DetectionController {
  constructor(private readonly detectionService: DetectionService) {}

  /**
   * GET /detections
   * Obtener todas las detecciones
   */
  @Get()
  async findAll(): Promise<Detection[]> {
    return await this.detectionService.findAll();
  }

  /**
   * GET /detections/photo/:photoId
   * Obtener detecciones de una foto específica
   */
  @Get('photo/:photoId')
  async findByPhotoId(@Param('photoId') photoId: string): Promise<Detection[]> {
    return await this.detectionService.findByPhotoId(photoId);
  }

  /**
   * GET /detections/bib/:bibNumber
   * Obtener detecciones por número de dorsal
   */
  @Get('bib/:bibNumber')
  async findByBibNumber(@Param('bibNumber') bibNumber: string): Promise<Detection[]> {
    return await this.detectionService.findByBibNumber(bibNumber);
  }

  /**
   * GET /detections/stats
   * Obtener estadísticas de detecciones
   */
  @Get('stats')
  async getStatistics() {
    return await this.detectionService.getStatistics();
  }
}
