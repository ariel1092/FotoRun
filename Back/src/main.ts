import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow Swagger UI
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images from Supabase
    }),
  );

  // CORS - Configuración para desarrollo y producción
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : isDevelopment
      ? [
          'http://localhost:3000', // Next.js default
          'http://localhost:5173', // Vite default
          'http://localhost:3001',
          'http://localhost:3002', // Alternative port
        ]
      : []; // En producción, no permitir ningún origen por defecto

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // En producción, no permitir requests sin origen
      if (!origin) {
        if (isDevelopment) {
          return callback(null, true); // Permitir en desarrollo (mobile apps, Postman, etc.)
        }
        return callback(new Error('CORS: Origin is required in production'));
      }

      // En desarrollo, permitir localhost
      if (isDevelopment) {
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }
      }

      // Verificar si el origen está en la lista permitida
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Loguear el origen rechazado
        if (isDevelopment) {
          console.log(`⚠️  CORS: Origen rechazado: ${origin}`);
          console.log(`   Orígenes permitidos: ${allowedOrigins.join(', ')}`);
        }
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // Cache preflight requests for 24 hours
  });

  // Validation Pipe global with sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
      forbidUnknownValues: true, // Throw error if unknown values are present
      disableErrorMessages: process.env.NODE_ENV === 'production', // Hide error messages in production
    }),
  );

  // 🔷 SWAGGER CONFIGURATION
  const config = new DocumentBuilder()
    .setTitle('Foto-Run API')
    .setDescription(
      'API para detección de dorsales de corredores usando Roboflow + OCR',
    )
    .setVersion('1.0')
    .addTag('auth', 'Endpoints de autenticación')
    .addTag('users', 'Gestión de usuarios')
    .addTag('runners', 'Gestión de corredores')
    .addTag('detection', 'Detección de dorsales')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // Este nombre se usa en @ApiBearerAuth()
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Foto-Run API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 8004;
  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api`);
}

bootstrap().catch((err) => {
  console.error('Error al iniciar la aplicación:', err);
  process.exit(1);
});
