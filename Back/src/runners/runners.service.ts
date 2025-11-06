import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Runner } from './entities/runner.entity';

@Injectable()
export class RunnersService {
  private readonly logger = new Logger(RunnersService.name);

  constructor(
    @InjectRepository(Runner)
    private runnersRepository: Repository<Runner>,
  ) {}

  async findAll(): Promise<Runner[]> {
    return this.runnersRepository.find({
      order: { plate_number: 'ASC' },
    });
  }

  async findByPlateNumber(plateNumber: number): Promise<Runner | null> {
    return this.runnersRepository.findOne({
      where: { plate_number: plateNumber },
    });
  }

  async findById(id: number): Promise<Runner> {
    const runner = await this.runnersRepository.findOne({ where: { id } });
    if (!runner) {
      throw new NotFoundException(`Runner con ID ${id} no encontrado`);
    }
    return runner;
  }

  async create(plateNumber: number, name: string, email?: string, phone?: string): Promise<Runner> {
    const runner = this.runnersRepository.create({
      plate_number: plateNumber,
      name,
      email,
      phone,
    });
    return this.runnersRepository.save(runner);
  }

  async update(id: number, updateData: Partial<Runner>): Promise<Runner> {
    await this.runnersRepository.update(id, updateData);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    const result = await this.runnersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Runner con ID ${id} no encontrado`);
    }
  }

  async seedRunners(): Promise<void> {
    this.logger.log('Iniciando seed de corredores...');

    const runners = [
      { plate_number: 341, name: 'Roberto Silva' },
      { plate_number: 847, name: 'María González' },
      { plate_number: 123, name: 'Carlos López' },
      { plate_number: 456, name: 'Ana Martínez' },
      { plate_number: 789, name: 'Pedro Rodríguez' },
      { plate_number: 101, name: 'Laura Fernández' },
      { plate_number: 202, name: 'Diego Sánchez' },
      { plate_number: 303, name: 'Carmen Ruiz' },
    ];

    for (const runner of runners) {
      const exists = await this.findByPlateNumber(runner.plate_number);
      if (!exists) {
        await this.create(runner.plate_number, runner.name);
        this.logger.log(`Creado runner: ${runner.name} (${runner.plate_number})`);
      }
    }

    this.logger.log('Seed de corredores completado');
  }
}