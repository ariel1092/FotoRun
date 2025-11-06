import { Controller, Get, Post, Body, Param, Delete, Put, NotFoundException } from '@nestjs/common';
import { RunnersService } from './runners.service';
import { Runner } from './entities/runner.entity';

@Controller('runners')
export class RunnersController {
  constructor(private readonly runnersService: RunnersService) {}

  @Get()
  async findAll(): Promise<Runner[]> {
    return this.runnersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Runner> {
    return this.runnersService.findById(+id);
  }

 @Get('plate/:plateNumber')
  async findByPlate(@Param('plateNumber') plateNumber: string): Promise<Runner | null> {
    // ✅ Retornar null es válido, o lanzar excepción
    const runner = await this.runnersService.findByPlateNumber(+plateNumber);
    
    if (!runner) {
      throw new NotFoundException(`Runner con placa ${plateNumber} no encontrado`);
    }
    
    return runner;
  }

  @Post()
  async create(
    @Body() body: { plate_number: number; name: string; email?: string; phone?: string },
  ): Promise<Runner> {
    return this.runnersService.create(body.plate_number, body.name, body.email, body.phone);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<Runner>,
  ): Promise<Runner> {
    return this.runnersService.update(+id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.runnersService.delete(+id);
    return { message: 'Runner eliminado correctamente' };
  }

  @Post('seed')
  async seed(): Promise<{ message: string }> {
    await this.runnersService.seedRunners();
    return { message: 'Seed completado exitosamente' };
  }
}