import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.get<string[]>('corsOrigin') ?? [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('VeilPay API')
    .setDescription(
      'Enterprise payroll platform API. Blockchain payment execution plugs in via PaymentProvider.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('port') ?? 3001;
  await app.listen(port);
  console.log(`VeilPay API listening on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
}

void bootstrap();
