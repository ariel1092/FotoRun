import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is missing in .env file. Please check your Supabase configuration.',
    );
  }

  return {
    type: 'postgres',
    url: databaseUrl,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false, // ⚠️ SOLO EN DESARROLLO - cambiar a false en producción
    logging: false,
    ssl: {
      rejectUnauthorized: false, // Necesario para Supabase
    },
  };
};