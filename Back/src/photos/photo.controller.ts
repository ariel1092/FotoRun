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
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PhotosService } from './photo.service';
import { Photo } from './photo.entity';
import { validateImageFile, validateImageFiles } from '../common/utils/file-validation.util';
import { QueueService } from '../queue/queue.service';

@Controller('photos')
export class PhotosController {
  constructor(
    private readonly photosService: PhotosService,
    private readonly queueService: QueueService,
  ) {}

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

    // Add photo processing job to queue
    await this.queueService.addPhotoProcessingJob(photo.id, photo.url);

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

    const uploadedPhotos = await Promise.all(uploadPromises);

    // Add photo processing jobs to queue
    await this.queueService.addBatchPhotoProcessingJobs(
      uploadedPhotos.map((photo) => ({
        photoId: photo.id,
        photoUrl: photo.url,
      })),
    );

    photos.push(...uploadedPhotos);

    return {
      photos,
      message: `${photos.length} fotos subidas exitosamente`,
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('photographer', 'admin')
  async getStats(@CurrentUser() user: User) {
    return await this.photosService.getStats(user.id);
  }

  @Get('search')
  async searchByBibNumber(
    @Query('bibNumber') bibNumber: string,
  ): Promise<Photo[]> {
    if (!bibNumber) {
      throw new BadRequestException('bibNumber query parameter is required');
    }

    return await this.photosService.findByBibNumber(bibNumber);
  }

  @Get('race/:raceId')
  async getPhotosByRace(@Param('raceId') raceId: string): Promise<Photo[]> {
    return await this.photosService.findByRace(raceId);
  }

  @Get(':id')
  async getPhoto(@Param('id') id: string): Promise<Photo> {
    return await this.photosService.findOne(id);
  }

  @Get(':id/status')
  async getPhotoStatus(@Param('id') id: string) {
    return await this.photosService.getProcessingStatus(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('photographer', 'admin')
  async getAllPhotos(@CurrentUser() user: User): Promise<Photo[]> {
    return await this.photosService.findAllByPhotographer(user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('photographer', 'admin')
  async deletePhoto(@Param('id') id: string): Promise<{ message: string }> {
    await this.photosService.remove(id);
    return { message: 'Photo deleted successfully' };
  }
}
