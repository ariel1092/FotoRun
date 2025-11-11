import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Race } from './race.entity';
import { CreateRaceDto } from './dto/create-race.dto';
import { UpdateRaceDto } from './dto/update-race.dto';

@Injectable()
export class RacesService {
  private readonly logger = new Logger(RacesService.name);

  constructor(
    @InjectRepository(Race)
    private readonly raceRepository: Repository<Race>,
  ) {}

  async create(data: CreateRaceDto): Promise<Race> {
    const race = this.raceRepository.create(data);
    return await this.raceRepository.save(race);
  }

  async findAll(): Promise<Race[]> {
    try {
      this.logger.log('Finding all active races');
      const races = await this.raceRepository.find({
        where: { isActive: true },
        order: { date: 'DESC' },
      });
      this.logger.log(`Found ${races.length} active races`);
      return races;
    } catch (error) {
      this.logger.error(`Error finding races: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findActive(): Promise<Race[]> {
    return await this.raceRepository.find({
      where: { isActive: true },
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Race> {
    const race = await this.raceRepository.findOne({
      where: { id },
      relations: ['photos'],
    });

    if (!race) {
      throw new NotFoundException(`Race with ID ${id} not found`);
    }

    return race;
  }

  async update(id: string, data: UpdateRaceDto): Promise<Race> {
    const race = await this.findOne(id);
    Object.assign(race, data);
    return await this.raceRepository.save(race);
  }

  async remove(id: string): Promise<void> {
    const race = await this.findOne(id);
    race.isActive = false;
    await this.raceRepository.save(race);
  }

  async hardDelete(id: string): Promise<void> {
    const result = await this.raceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Race with ID ${id} not found`);
    }
  }
}
