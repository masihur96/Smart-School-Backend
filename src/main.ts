process.env.TZ = 'UTC'; // Force UTC timezone globally for all date operations

import * as WebSocket from 'ws';
if (typeof global.WebSocket === 'undefined') {
  (global as any).WebSocket = WebSocket;
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { UnauthorizedExceptionFilter } from './common/filters/unauthorized.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
    }),
  );

  // Apply global exception filters
  app.useGlobalFilters(new UnauthorizedExceptionFilter());

  // Enable CORS
  app.enableCors();

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Smart School Backend API')
    .setDescription(
      'API documentation for Smart School Backend - A comprehensive school management system',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Admin', 'Admin management endpoints')
    .addTag('Teacher', 'Teacher operations endpoints')
    .addTag('Student', 'Student endpoints')
    .addTag('General', 'General endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(
    `Smart School Backend API is running on http://localhost:${port}`,
  );
  console.log(
    `Swagger documentation is available at http://localhost:${port}/api/docs`,
  );
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
