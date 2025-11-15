import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Photo } from './photo.entity';
import { Detection } from '../detection/entities/detection.entity';
import { RoboflowService } from '../roboflow/roboflow.service';
import { StorageService } from '../storage/storage.service';
import { BibDetectionService } from '../detection/bib-detection.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import axios from 'axios';

@Injectable()
export class PhotosService {
  private readonly logger = new Logger(PhotosService.name);

  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    @InjectRepository(Detection)
    private readonly detectionRepository: Repository<Detection>,
    private readonly roboflowService: RoboflowService,
    private readonly storageService: StorageService,
    private readonly bibDetectionService: BibDetectionService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(data: {
    url: string;
    thumbnailUrl?: string;
    cloudinaryPublicId?: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    raceId: string;
    uploadedBy: string;
  }): Promise<Photo> {
    const photo = this.photoRepository.create(data);
    return await this.photoRepository.save(photo);
  }

  /**
   * Upload a photo to Cloudinary and create database record
   */
  async uploadPhoto(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    size: number,
    raceId: string,
    uploadedBy: string,
  ): Promise<Photo> {
    try {
      this.logger.log(`Uploading photo to Cloudinary: ${originalName}`);

      // Generate unique filename
      const ext = originalName.split('.').pop() || 'jpg';
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;

      // Upload to Cloudinary
      const uploadResult = await this.cloudinaryService.uploadImage(
        buffer,
        filename,
        'jerpro/photos',
      );

      this.logger.log(
        `Photo uploaded to Cloudinary. Public ID: ${uploadResult.publicId}`,
      );

      // Generate URLs (we'll use Cloudinary transformations on-the-fly)
      const watermarkedUrl = this.cloudinaryService.getWatermarkedUrl(
        uploadResult.publicId,
        'JERPRO',
      );
      const thumbnailUrl = this.cloudinaryService.getThumbnailUrl(
        uploadResult.publicId,
      );

      // Create database record
      const photo = await this.create({
        url: watermarkedUrl, // Store watermarked URL as default
        thumbnailUrl: thumbnailUrl,
        cloudinaryPublicId: uploadResult.publicId,
        filename: uploadResult.publicId, // Use publicId as filename for compatibility
        originalName,
        mimeType,
        size,
        raceId,
        uploadedBy,
      });

      // Set initial processing status
      photo.processingStatus = 'pending';
      await this.photoRepository.save(photo);

      this.logger.log(`Photo uploaded successfully: ${photo.id}`);
      return photo;
    } catch (error) {
      this.logger.error(`Error uploading photo: ${error.message}`);
      throw error;
    }
  }

  async processPhoto(photoId: string, photoUrl: string, skipStatusUpdate: boolean = false): Promise<void> {
    try {
      // Update status to processing first (unless already updated)
      if (!skipStatusUpdate) {
        await this.updateProcessingStatus(photoId, 'processing');
      }
      this.logger.log(`Processing photo: ${photoId}`);

      const photo = await this.photoRepository.findOne({
        where: { id: photoId },
      });

      if (!photo) {
        throw new NotFoundException(`Photo with ID ${photoId} not found`);
      }

      // 🔧 MEJORA CRÍTICA: Procesar ANTES de aplicar watermark
      // El watermark puede interferir con el OCR y la detección de dorsales
      // Siempre usar la imagen original sin transformaciones para procesamiento
      let downloadUrl: string;
      
      if (photo.cloudinaryPublicId) {
        // Usar imagen completamente original sin watermark ni transformaciones
        downloadUrl = this.cloudinaryService.getTrulyOriginalUrl(photo.cloudinaryPublicId);
        this.logger.log(`✅ Using Cloudinary truly original URL (NO watermark) for OCR processing: ${downloadUrl}`);
      } else {
        // Fallback: usar la URL proporcionada (pero debería tener cloudinaryPublicId)
        downloadUrl = photoUrl;
        this.logger.warn(`⚠️ Photo ${photoId} doesn't have cloudinaryPublicId, using provided URL (may have watermark): ${downloadUrl}`);
      }

      // Download image
      const imageResponse = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
      });
      const imageBuffer = Buffer.from(imageResponse.data, 'binary');

      // Detect bib numbers with enhanced processing
      // Using lower confidence thresholds to detect more dorsales
      // OCR will verify and correct the results
      const enhancedDetections = await this.bibDetectionService.detectBibNumbers(
        imageBuffer,
        {
          minDetectionConfidence: 0.3, // Lower threshold to catch more detections
          minOCRConfidence: 0.5, // OCR will verify with this threshold
          useOCR: true, // Always use OCR for verification
          enhanceImage: true,
          ocrFallback: true, // Always fallback to OCR when confidence is low
        },
      );

      this.logger.log(
        `Found ${enhancedDetections.length} enhanced detections for photo ${photoId}`,
      );

      // 🔧 MEJORA UX: Actualizar estado a "completed" INMEDIATAMENTE después de detectar dorsales
      // Esto mejora la experiencia del usuario mostrando el resultado rápidamente
      // El guardado de detecciones puede continuar en segundo plano
      await this.updateProcessingStatus(photoId, 'completed');
      photo.isProcessed = true;
      photo.processedAt = new Date();
      await this.photoRepository.save(photo);
      this.logger.log(`Photo ${photoId} status updated to completed (${enhancedDetections.length} detections found)`);

      // Save detections to database (puede continuar después de actualizar el estado)
      for (const enhanced of enhancedDetections) {
        const detection = this.detectionRepository.create({
          photoId: photo.id,
          bibNumber: enhanced.bibNumber,
          confidence: enhanced.confidence,
          detectionConfidence: enhanced.detectionConfidence,
          ocrConfidence: enhanced.ocrConfidence,
          detectionMethod: enhanced.metadata.method,
          x: enhanced.x,
          y: enhanced.y,
          width: enhanced.width,
          height: enhanced.height,
          metadata: {
            class_id: enhanced.metadata.class_id,
            detection_id: enhanced.metadata.detection_id,
            method: enhanced.metadata.method,
          },
          ocrMetadata: enhanced.ocrResult
            ? {
                rawText: enhanced.ocrResult.rawText,
                alternatives: enhanced.ocrResult.alternatives || [],
              }
            : undefined,
        });

        await this.detectionRepository.save(detection);
      }

      this.logger.log(`Photo ${photoId} processed successfully`);
    } catch (error) {
      this.logger.error(`Error processing photo ${photoId}: ${error.message}`);
      
      // Update photo status to failed
      try {
        const photo = await this.photoRepository.findOne({
          where: { id: photoId },
        });
        if (photo) {
          photo.processingStatus = 'failed';
          photo.processingError = error.message;
          await this.photoRepository.save(photo);
        }
      } catch (updateError) {
        this.logger.error(
          `Failed to update photo status to failed: ${updateError.message}`,
        );
      }
      
      throw error;
    }
  }

  /**
   * Cancel photo processing
   */
  async cancelProcessing(photoId: string): Promise<void> {
    const photo = await this.photoRepository.findOne({
      where: { id: photoId },
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${photoId} not found`);
    }

    // Only cancel if status is pending or processing
    if (photo.processingStatus !== 'pending' && photo.processingStatus !== 'processing') {
      throw new BadRequestException(
        `Cannot cancel photo processing. Current status: ${photo.processingStatus}`,
      );
    }

    photo.processingStatus = 'failed';
    photo.processingError = 'Processing cancelled by user';
    await this.photoRepository.save(photo);

    this.logger.log(`Photo ${photoId} processing cancelled`);
  }

  /**
   * Update photo processing status
   */
  async updateProcessingStatus(
    photoId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    error?: string,
  ): Promise<void> {
    const photo = await this.photoRepository.findOne({
      where: { id: photoId },
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${photoId} not found`);
    }

    photo.processingStatus = status;
    if (status === 'completed') {
      photo.isProcessed = true;
      photo.processedAt = new Date();
      photo.processingError = null;
    } else if (status === 'failed') {
      photo.processingError = error || null;
    } else if (status === 'processing') {
      photo.processingError = null;
    }

    await this.photoRepository.save(photo);
    this.logger.log(`Photo ${photoId} status updated to: ${status}`);
  }

  /**
   * Get photo processing status
   */
  async getProcessingStatus(
    photoId: string,
  ): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string | null;
    isProcessed: boolean;
    processedAt?: Date | null;
  }> {
    const photo = await this.photoRepository.findOne({
      where: { id: photoId },
      select: ['id', 'processingStatus', 'processingError', 'isProcessed', 'processedAt'],
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${photoId} not found`);
    }

    return {
      status: photo.processingStatus,
      error: photo.processingError,
      isProcessed: photo.isProcessed,
      processedAt: photo.processedAt,
    };
  }

  async findByBibNumber(bibNumber: string, raceId?: string): Promise<Photo[]> {
    const queryBuilder = this.photoRepository
      .createQueryBuilder('photo')
      .innerJoin('photo.detections', 'detection')
      .where('detection.bibNumber = :bibNumber', { bibNumber })
      .andWhere('photo.isProcessed = :isProcessed', { isProcessed: true });

    // Filter by raceId if provided
    if (raceId) {
      queryBuilder.andWhere('photo.raceId = :raceId', { raceId });
    }

    return await queryBuilder
      .leftJoinAndSelect('photo.race', 'race')
      .leftJoinAndSelect('photo.detections', 'allDetections')
      .orderBy('photo.createdAt', 'DESC')
      .getMany();
  }

  async findByRace(raceId: string): Promise<Photo[]> {
    return await this.photoRepository.find({
      where: { raceId },
      relations: ['detections', 'race'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Photo> {
    const photo = await this.photoRepository.findOne({
      where: { id },
      relations: ['detections', 'race', 'uploader'],
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${id} not found`);
    }

    return photo;
  }

  async findAll(): Promise<Photo[]> {
    return await this.photoRepository.find({
      relations: ['detections', 'race'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByPhotographer(photographerId: string): Promise<Photo[]> {
    try {
      this.logger.log(`Finding all photos for photographer: ${photographerId}`);
      // Cargar fotos sin la relación detections para evitar problemas con columnas faltantes
      const photos = await this.photoRepository.find({
        where: { uploadedBy: photographerId },
        order: { createdAt: 'DESC' },
      });
      
      // Si necesitamos las detecciones, las cargamos por separado
      if (photos.length > 0) {
        const photoIds = photos.map(p => p.id);
        const detections = await this.detectionRepository.find({
          where: { photoId: In(photoIds) },
        });
        
        // Asignar detecciones a las fotos
        photos.forEach(photo => {
          photo.detections = detections.filter(d => d.photoId === photo.id);
        });
      }
      
      this.logger.log(`Found ${photos.length} photos for photographer: ${photographerId}`);
      return photos;
    } catch (error) {
      this.logger.error(`Error finding photos for photographer ${photographerId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 🗑️ Eliminar foto con validación de permisos
   * Solo el dueño de la foto o un admin pueden eliminarla
   */
  async remove(id: string, userId?: string, userRole?: string): Promise<void> {
    const photo = await this.photoRepository.findOne({
      where: { id },
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${id} not found`);
    }

    // 🔐 VALIDACIÓN DE PERMISOS: Solo el dueño o admin pueden eliminar
    if (userId && userRole !== 'admin') {
      if (photo.uploadedBy !== userId) {
        this.logger.warn(
          `User ${userId} attempted to delete photo ${id} owned by ${photo.uploadedBy}`,
        );
        throw new NotFoundException(`Photo with ID ${id} not found`); // No revelar que existe
      }
    }

    this.logger.log(`Deleting photo ${id} (owned by ${photo.uploadedBy})...`);

    // Delete associated detections first (to avoid foreign key constraint violation)
    try {
      const deleteDetectionsResult = await this.detectionRepository.delete({ photoId: id });
      if (deleteDetectionsResult.affected && deleteDetectionsResult.affected > 0) {
        this.logger.log(`Deleted ${deleteDetectionsResult.affected} detections for photo ${id}`);
      }
    } catch (error) {
      this.logger.warn(
        `Error deleting detections for photo ${id}: ${error.message}`,
      );
    }

    // Delete from Cloudinary
    try {
      if (photo.cloudinaryPublicId) {
        await this.cloudinaryService.deleteImage(photo.cloudinaryPublicId);
        this.logger.log(`Photo deleted from Cloudinary: ${photo.cloudinaryPublicId}`);
      } else if (photo.filename) {
        // Fallback: try to delete from Supabase if no Cloudinary ID (for old photos)
        await this.storageService.delete(photo.filename);
        this.logger.log(`Photo deleted from Supabase storage: ${photo.filename}`);

        // Delete thumbnail if exists
        if (photo.thumbnailUrl) {
          const thumbnailPath = photo.thumbnailUrl.split('/').pop();
          if (thumbnailPath) {
            await this.storageService.delete(`thumbnails/${thumbnailPath}`);
          }
        }
      }
    } catch (error) {
      this.logger.warn(
        `Error deleting photo from storage (continuing with DB deletion): ${error.message}`,
      );
    }

    // Delete from database
    const result = await this.photoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Photo with ID ${id} not found`);
    }

    this.logger.log(`Photo deleted successfully: ${id}`);
  }

  async getStats(photographerId: string): Promise<{
    totalPhotos: number;
    processedPhotos: number;
    pendingPhotos: number;
    totalDetections: number;
    photosByRace: Array<{ raceId: string; raceName: string; count: number }>;
  }> {
    try {
      this.logger.log(`Getting stats for photographer: ${photographerId}`);
      
      const totalPhotos = await this.photoRepository.count({
        where: { uploadedBy: photographerId },
      });

      const processedPhotos = await this.photoRepository.count({
        where: { uploadedBy: photographerId, isProcessed: true },
      });

      const pendingPhotos = totalPhotos - processedPhotos;

      const totalDetections = await this.detectionRepository
        .createQueryBuilder('detection')
        .innerJoin('detection.photo', 'photo')
        .where('photo.uploadedBy = :photographerId', { photographerId })
        .getCount();

      const photosByRace = await this.photoRepository
        .createQueryBuilder('photo')
        .select('photo.raceId', 'raceId')
        .addSelect('COALESCE(race.name, \'Sin nombre\')', 'raceName')
        .addSelect('COUNT(photo.id)', 'count')
        .leftJoin('photo.race', 'race')
        .where('photo.uploadedBy = :photographerId', { photographerId })
        .groupBy('photo.raceId')
        .addGroupBy('race.name')
        .getRawMany();

      const result = {
        totalPhotos,
        processedPhotos,
        pendingPhotos,
        totalDetections,
        photosByRace: photosByRace.map((item) => ({
          raceId: item.raceId,
          raceName: item.raceName || 'Sin nombre',
          count: parseInt(item.count, 10),
        })),
      };

      this.logger.log(`Stats retrieved successfully for photographer: ${photographerId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error getting stats for photographer ${photographerId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
