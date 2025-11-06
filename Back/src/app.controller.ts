import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check del servidor' })
  @ApiResponse({
    status: 200,
    description: 'Servidor funcionando correctamente',
    schema: {
      example: {
        status: 'OK',
        timestamp: '2025-10-31T10:45:00.000Z',
        environment: 'development',
        database: 'Connected',
      },
    },
  })
  getHealthCheck() {
    return this.appService.getHealthCheck();
  }

  @Get('config')
  @ApiOperation({ summary: 'Obtener configuración del servidor' })
  @ApiResponse({
    status: 200,
    description: 'Configuración del servidor',
    schema: {
      example: {
        supabaseUrl: 'https://fwvcougpqgrksxultizq.supabase.co',
        port: 8000,
        corsOrigin: 'http://localhost:5173',
      },
    },
  })
  getConfig() {
    return this.appService.getConfig();
  }
}
