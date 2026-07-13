import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { requestIdMiddleware } from './common/http';
import { buildOpenApiConfig } from './common/openapi.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.use(requestIdMiddleware);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api/v1', {
    exclude: [
      { path: 'health/live', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
    ],
  });
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
  });
  const openApi = buildOpenApiConfig();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, openApi), {
    customSiteTitle: 'VeilPay API Reference',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  });
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`VeilPay API listening on port ${port}`);
}
void bootstrap();
