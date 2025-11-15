import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Race } from './race.entity';
import { CreateRaceDto } from './dto/create-race.dto';
import { UpdateRaceDto } from './dto/update-race.dto';
import { PhotosService } from '../photos/photo.service';

@Injectable()
export class RacesService {
  private readonly logger = new Logger(RacesService.name);

  constructor(
    @InjectRepository(Race)
    private readonly raceRepository: Repository<Race>,
    @Inject(forwardRef(() => PhotosService))
    private readonly photosService: PhotosService,
  ) {}

  async create(data: CreateRaceDto, userId?: string): Promise<Race> {
    const race = this.raceRepository.create({
      ...data,
      createdBy: userId || null,
    });
    return await this.raceRepository.save(race);
  }

  async findAll(userId?: string, userRole?: string): Promise<Race[]> {
    try {
      this.logger.log(`Finding races for user: ${userId}, role: ${userRole}`);
      
      // Si es admin, puede ver todos los eventos
      // Si es photographer, solo ve sus eventos
      // Si no está autenticado o es user, ve todos los eventos activos (para búsqueda pública)
      const where: any = { isActive: true };
      
      if (userRole === 'photographer' && userId) {
        where.createdBy = userId;
        this.logger.log(`Filtering races by photographer: ${userId}`);
      }
      
      const races = await this.raceRepository.find({
        where,
        order: { date: 'DESC' },
      });
      this.logger.log(`Found ${races.length} races`);
      return races;
    } catch (error) {
      this.logger.error(`Error finding races: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findActive(userId?: string, userRole?: string): Promise<Race[]> {
    // Para búsqueda pública (sin autenticación), mostrar todos los eventos activos
    // Si está autenticado como photographer, solo sus eventos
    const where: any = { isActive: true };
    
    if (userRole === 'photographer' && userId) {
      where.createdBy = userId;
    }
    
    return await this.raceRepository.find({
      where,
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string, userRole?: string): Promise<Race> {
    const race = await this.raceRepository.findOne({
      where: { id },
      relations: ['photos'],
    });

    if (!race) {
      throw new NotFoundException(`Race with ID ${id} not found`);
    }

    // Si es photographer y no es el dueño, no puede verlo
    if (userRole === 'photographer' && userId && race.createdBy !== userId) {
      throw new NotFoundException(`Race with ID ${id} not found`);
    }

    return race;
  }

  async update(id: string, data: UpdateRaceDto, userId?: string, userRole?: string): Promise<Race> {
    const race = await this.findOne(id, userId, userRole);
    
    // Si es photographer y no es el dueño, no puede actualizarlo
    if (userRole === 'photographer' && userId && race.createdBy !== userId) {
      throw new NotFoundException(`Race with ID ${id} not found`);
    }
    
    Object.assign(race, data);
    return await this.raceRepository.save(race);
  }

  /**
   * 🗑️ Desactivar evento (soft delete)
   * Solo marca el evento como inactivo, no elimina las fotos
   */
  async remove(id: string, userId?: string, userRole?: string): Promise<void> {
    const race = await this.findOne(id, userId, userRole);
    
    // Si es photographer y no es el dueño, no puede desactivarlo
    if (userRole === 'photographer' && userId && race.createdBy !== userId) {
      throw new NotFoundException(`Race with ID ${id} not found`);
    }
    
    race.isActive = false;
    await this.raceRepository.save(race);
    this.logger.log(`Race ${id} deactivated (soft delete)`);
  }

  /**
   * 🗑️ Eliminar evento completamente (hard delete)
   * Elimina el evento y todas las fotos asociadas
   * ⚠️ ADVERTENCIA: Esta operación no se puede deshacer
   */
  async hardDelete(id: string, userId?: string, userRole?: string): Promise<{
    deletedRace: boolean;
    deletedPhotos: number;
    message: string;
  }> {
    const race = await this.findOne(id);

    if (!race) {
      throw new NotFoundException(`Race with ID ${id} not found`);
    }

    this.logger.log(`Hard deleting race ${id} (${race.name})...`);

    // Obtener todas las fotos asociadas al evento usando findOne con relaciones
    const raceWithPhotos = await this.raceRepository.findOne({
      where: { id },
      relations: ['photos'],
    });

    let deletedPhotosCount = 0;

    // Eliminar todas las fotos asociadas
    if (raceWithPhotos && raceWithPhotos.photos && raceWithPhotos.photos.length > 0) {
      this.logger.log(`Found ${raceWithPhotos.photos.length} photos associated with race ${id}`);
      
      // Si el usuario es admin, eliminar todas las fotos
      // Si no es admin, solo eliminar las fotos que le pertenecen
      const photosToDelete = userRole === 'admin'
        ? raceWithPhotos.photos
        : raceWithPhotos.photos.filter(p => p.uploadedBy === userId);
      
      this.logger.log(`Deleting ${photosToDelete.length} photos (user is ${userRole || 'unknown'})`);
      
      for (const photo of photosToDelete) {
        try {
          // Eliminar foto (si es admin, puede eliminar cualquier foto)
          await this.photosService.remove(photo.id, userId, userRole);
          deletedPhotosCount++;
        } catch (error) {
          this.logger.error(
            `Error deleting photo ${photo.id}: ${error.message}`,
          );
          // Continuar eliminando otras fotos incluso si una falla
        }
      }
      
      if (userRole !== 'admin' && raceWithPhotos.photos.length > photosToDelete.length) {
        const skippedCount = raceWithPhotos.photos.length - photosToDelete.length;
        this.logger.warn(
          `Skipped ${skippedCount} photos that don't belong to user ${userId}`,
        );
      }
    } else {
      this.logger.log(`No photos found for race ${id}`);
    }

    // Eliminar el evento de la base de datos
    const result = await this.raceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Race with ID ${id} not found`);
    }

    this.logger.log(
      `Race ${id} deleted successfully. Deleted ${deletedPhotosCount} photos.`,
    );

    return {
      deletedRace: true,
      deletedPhotos: deletedPhotosCount,
      message: `Race deleted successfully. ${deletedPhotosCount} photos deleted.`,
    };
  }
}
