import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RacesService } from './race.service';
import { CreateRaceDto } from './dto/create-race.dto';
import { UpdateRaceDto } from './dto/update-race.dto';
import { Race } from './race.entity';

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
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.racesService.remove(id);
    return { message: 'Race deactivated successfully' };
  }
}
