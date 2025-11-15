import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Body,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PhotosService } from './photo.service';
import { Photo } from './photo.entity';
import {
  validateImageFile,
  validateImageFiles,
} from '../common/utils/file-validation.util';
import { QueueService } from '../queue/queue.service';

@Controller('photos')
export class PhotosController {
  private readonly logger = new Logger(PhotosController.name);
  private queueService: QueueService;

  constructor(
    private readonly photosService: PhotosService,
    private readonly moduleRef: ModuleRef,
  ) {}

  private getQueueService(): QueueService {
    if (!this.queueService) {
      this.queueService = this.moduleRef.get(QueueService, { strict: false });
    }
    return this.queueService;
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('photographer', 'admin')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body('raceId') raceId: string,
    @CurrentUser() user: User,
  ): Promise<Photo> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!raceId) {
      throw new BadRequestException('raceId is required');
    }

    // Validate file using magic numbers
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      throw new BadRequestException(validation.error || 'Invalid file');
    }

    // Upload photo to Supabase Storage
    const photo = await this.photosService.uploadPhoto(
      file.buffer,
      file.originalname,
      file.mimetype,
      file.size,
      raceId,
      user.id,
    );

    // Update status to processing FIRST so user sees it immediately
    // This happens before adding to queue to ensure immediate feedback
    await this.photosService.updateProcessingStatus(photo.id, 'processing');
    this.logger.log(`Photo ${photo.id} status updated to processing`);
    
    // Try to add photo processing job to queue
    // If queue is not available, process directly
    try {
      await this.getQueueService().addPhotoProcessingJob(photo.id, photo.url);
      this.logger.log(`Photo ${photo.id} added to processing queue`);
      // Reload photo to get updated status
      photo = await this.photosService.findOne(photo.id);
    } catch (error) {
      this.logger.warn(
        `Failed to add photo ${photo.id} to queue: ${error.message}. Processing directly...`,
      );
      // Fallback: process photo directly if queue is not available
      // Update status to processing FIRST so user sees it immediately
      await this.photosService.updateProcessingStatus(photo.id, 'processing');
      // Reload photo to get updated status
      photo = await this.photosService.findOne(photo.id);
      // Process in background without blocking the response
      this.photosService
        .processPhoto(photo.id, photo.url, true) // Skip status update since we already did it
        .catch((processError) => {
          this.logger.error(
            `Error processing photo ${photo.id} directly: ${processError.message}`,
          );
          // Update status to failed
          this.photosService
            .updateProcessingStatus(photo.id, 'failed', processError.message)
            .catch(() => {
              // Ignore errors updating status
            });
        });
    }

    return photo;
  }

  @Post('upload-multiple')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('photographer', 'admin')
  @UseInterceptors(
    FilesInterceptor('photos', 50, {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
      },
    }),
  )
  async uploadMultiplePhotos(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('raceId') raceId: string,
    @CurrentUser() user: User,
  ): Promise<{ photos: Photo[]; message: string }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    if (!raceId) {
      throw new BadRequestException('raceId is required');
    }

    // Validate all files using magic numbers
    const validations = validateImageFiles(files);
    const invalidFiles = validations.filter((v) => !v.isValid);
    if (invalidFiles.length > 0) {
      throw new BadRequestException(
        `Invalid files detected: ${invalidFiles.map((v) => v.error).join(', ')}`,
      );
    }

    const photos: Photo[] = [];

    // Upload all photos in parallel
    const uploadPromises = files.map((file) =>
      this.photosService.uploadPhoto(
        file.buffer,
        file.originalname,
        file.mimetype,
        file.size,
        raceId,
        user.id,
      ),
    );

    let uploadedPhotos = await Promise.all(uploadPromises);
    this.logger.log(`Uploaded ${uploadedPhotos.length} photos, updating status to processing...`);

    // Update status to processing FIRST for all photos (before adding to queue)
    // This ensures immediate feedback even if queue fails
    try {
      await Promise.all(
        uploadedPhotos.map((photo) => {
          this.logger.log(`Updating photo ${photo.id} status to processing`);
          return this.photosService.updateProcessingStatus(photo.id, 'processing');
        }),
      );
      this.logger.log(
        `✅ ${uploadedPhotos.length} photos status updated to processing`,
      );
    } catch (statusError) {
      this.logger.error(
        `❌ Error updating photos status to processing: ${statusError.message}`,
      );
      // Continue anyway - try to add to queue
    }

    // Try to add photo processing jobs to queue
    // If queue is not available, process directly
    try {
      await this.getQueueService().addBatchPhotoProcessingJobs(
        uploadedPhotos.map((photo) => ({
          photoId: photo.id,
          photoUrl: photo.url,
        })),
      );
      this.logger.log(
        `${uploadedPhotos.length} photos added to processing queue`,
      );
      // Reload photos to get updated status
      uploadedPhotos = await Promise.all(
        uploadedPhotos.map((photo) => this.photosService.findOne(photo.id)),
      );
    } catch (error) {
      this.logger.warn(
        `Failed to add photos to queue: ${error.message}. Processing directly...`,
      );
      // Fallback: process photos directly if queue is not available
      // Update status to processing FIRST so user sees it immediately
      await Promise.all(
        uploadedPhotos.map((photo) =>
          this.photosService.updateProcessingStatus(photo.id, 'processing'),
        ),
      );
      // Reload photos to get updated status
      uploadedPhotos = await Promise.all(
        uploadedPhotos.map((photo) => this.photosService.findOne(photo.id)),
      );
      // Process in background without blocking the response
      uploadedPhotos.forEach((photo) => {
        this.photosService
          .processPhoto(photo.id, photo.url, true) // Skip status update since we already did it
          .catch((processError) => {
            this.logger.error(
              `Error processing photo ${photo.id} directly: ${processError.message}`,
            );
            // Update status to failed
            this.photosService
              .updateProcessingStatus(photo.id, 'failed', processError.message)
              .catch(() => {
                // Ignore errors updating status
              });
          });
      });
    }

    photos.push(...uploadedPhotos);

    return {
      photos,
      message: `${photos.length} fotos subidas exitosamente`,
    };
  }

  // Endpoints específicos deben ir ANTES de los endpoints con parámetros dinámicos
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('photographer', 'admin')
  async getStats(@CurrentUser() user: User) {
    try {
      return await this.photosService.getStats(user.id);
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }

  @Get('search')
  async searchByBibNumber(
    @Query('bibNumber') bibNumber: string,
    @Query('raceId') raceId?: string,
  ): Promise<Photo[]> {
    if (!bibNumber) {
      throw new BadRequestException('bibNumber query parameter is required');
    }

    return await this.photosService.findByBibNumber(bibNumber, raceId);
  }

  @Get('race/:raceId')
  async getPhotosByRace(@Param('raceId') raceId: string): Promise<Photo[]> {
    return await this.photosService.findByRace(raceId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('photographer', 'admin')
  async getAllPhotos(@CurrentUser() user: User): Promise<Photo[]> {
    try {
      return await this.photosService.findAllByPhotographer(user.id);
    } catch (error) {
      console.error('Error in getAllPhotos:', error);
      throw error;
    }
  }

  // Endpoints con parámetros dinámicos deben ir DESPUÉS de los específicos
  @Get(':id/status')
  async getPhotoStatus(@Param('id') id: string) {
    return await this.photosService.getProcessingStatus(id);
  }

  @Get(':id')
  async getPhoto(@Param('id') id: string): Promise<Photo> {
    return await this.photosService.findOne(id);
  }

  @Post(':id/cancel-processing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('photographer', 'admin')
  async cancelProcessing(
    @Param('id') photoId: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    try {
      await this.photosService.cancelProcessing(photoId);
      return { message: 'Photo processing cancelled successfully' };
    } catch (error) {
      this.logger.error(`Error cancelling photo processing: ${error.message}`);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('photographer', 'admin')
  async deletePhoto(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.photosService.remove(id, user.id, user.role);
    return { message: 'Photo deleted successfully' };
  }
}
