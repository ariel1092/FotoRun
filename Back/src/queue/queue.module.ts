import { Module, forwardRef, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { PhotoProcessingModule } from './photo-processing.module';
import { PHOTO_PROCESSING_QUEUE } from './queue.constants';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('Redis');
        const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
        const redisPort = configService.get<number>('REDIS_PORT', 6379);
        const redisPassword = configService.get<string>('REDIS_PASSWORD');
        const redisDb = configService.get<number>('REDIS_DB', 0);

        // Log Redis configuration
        logger.log(`🔴 Redis Config - Host: ${redisHost}`);
        logger.log(`🔴 Redis Config - Port: ${redisPort}`);
        logger.log(`🔴 Redis Config - DB: ${redisDb}`);
        logger.log(`🔴 Redis Config - Password: ${redisPassword ? '***' : 'No configurado'}`);

        return {
          redis: {
            host: redisHost,
            port: redisPort,
            password: redisPassword,
            db: redisDb,
            retryStrategy: (times: number) => {
              if (times > 20) {
                logger.error('❌ Redis: Máximo de reintentos alcanzado. Verifica la configuración.');
                logger.error(`   Host configurado: ${redisHost}`);
                logger.error(`   Port configurado: ${redisPort}`);
                logger.error('   💡 Verifica que el servicio Redis esté creado en Render y que las variables de entorno estén configuradas.');
                return null;
              }
              const delay = Math.min(times * 200, 2000);
              if (times % 5 === 0) {
                logger.warn(`⚠️  Redis: Reintentando conexión (intento ${times}/20) en ${delay}ms...`);
              }
              return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: false, // No fallar inmediatamente si Redis no está disponible
            lazyConnect: true, // Conectar solo cuando sea necesario
          },
          defaultJobOptions: {
            removeOnComplete: 100,
            removeOnFail: 500,
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: PHOTO_PROCESSING_QUEUE,
    }),
    forwardRef(() => PhotoProcessingModule),
  ],
  providers: [QueueService],
  exports: [BullModule, QueueService],
})
export class QueueModule {}

