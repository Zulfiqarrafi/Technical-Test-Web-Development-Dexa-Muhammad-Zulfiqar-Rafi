import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule.register());
  const config = app.get(ConfigService);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  fs.mkdirSync(path.join(uploadsDir, 'attendance'), { recursive: true });
  app.use('/uploads', express.static(uploadsDir));

  const standalone = config.get<string>('STANDALONE_MICROSERVICES') === 'true';

  if (!standalone) {
    const empHost = config.get<string>('MS_EMPLOYEE_HOST') || '127.0.0.1';
    const empPort = Number(config.get<string>('MS_EMPLOYEE_PORT') || 4001);
    const attHost = config.get<string>('MS_ATTENDANCE_HOST') || '127.0.0.1';
    const attPort = Number(config.get<string>('MS_ATTENDANCE_PORT') || 4002);

    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.TCP,
      options: { host: empHost, port: empPort },
    });

    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.TCP,
      options: { host: attHost, port: attPort },
    });

    await app.startAllMicroservices();
    logger.log(`Employee Microservice aktif di tcp://${empHost}:${empPort}`);
    logger.log(`Attendance Microservice aktif di tcp://${attHost}:${attPort}`);
  }

  const port = Number(config.get<string>('PORT') || 3000);
  await app.listen(port, '0.0.0.0');
  logger.log(`API Gateway berjalan di http://localhost:${port}`);
}

bootstrap();
