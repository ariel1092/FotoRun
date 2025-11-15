import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHealthCheck(): {
    status: string;
    timestamp: string;
    environment: string;
    database: string;
  } {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: this.configService.get<string>('DATABASE_URL')
        ? 'Connected'
        : 'Not configured',
    };
  }

  getConfig(): {
    supabaseUrl: string;
    port: number;
    corsOrigin: string;
  } {
    return {
      supabaseUrl: this.configService.get<string>('SUPABASE_URL') || 'Not set',
      port: this.configService.get<number>('PORT') || 8004,
      corsOrigin:
        this.configService.get<string>('CORS_ORIGIN') ||
        'http://localhost:5173',
    };
  }
}
