import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RacesService } from './race.service';
import { CreateRaceDto } from './dto/create-race.dto';
import { UpdateRaceDto } from './dto/update-race.dto';
import { Race } from './race.entity';
import { User } from '../users/entities/user.entity';

@Controller('races')
export class RacesController {
  constructor(private readonly racesService: RacesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() data: CreateRaceDto): Promise<Race> {
    return await this.racesService.create(data);
  }

  @Get()
  async findAll(): Promise<Race[]> {
    return await this.racesService.findAll();
  }

  @Get('active')
  async findActive(): Promise<Race[]> {
    return await this.racesService.findActive();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Race> {
    return await this.racesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() data: UpdateRaceDto,
  ): Promise<Race> {
    return await this.racesService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('photographer', 'admin')
  async remove(
    @Param('id') id: string,
    @Query('hardDelete') hardDelete?: string,
    @CurrentUser() user?: User,
  ): Promise<{ message: string; deletedPhotos?: number }> {
    // Si hardDelete=true, eliminar completamente el evento y sus fotos
    // ⚠️ Solo admin puede hacer hard delete
    if (hardDelete === 'true') {
      if (!user || user.role !== 'admin') {
        throw new ForbiddenException(
          'Only admin users can permanently delete races',
        );
      }
      
      const result = await this.racesService.hardDelete(id, user.id, user.role);
      return {
        message: result.message,
        deletedPhotos: result.deletedPhotos,
      };
    }
    
    // Soft delete por defecto (solo desactiva el evento)
    // Cualquier usuario autenticado puede desactivar un evento
    await this.racesService.remove(id);
    return { message: 'Race deactivated successfully' };
  }
}
