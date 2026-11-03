import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DatabaseModule } from './database/database.module';
import { AttendanceMsModule } from './services/attendance-service/attendance-ms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    AttendanceMsModule,
  ],
})
class AttendanceStandaloneModule {}

async function bootstrap() {
  const host = process.env.MS_ATTENDANCE_HOST || '127.0.0.1';
  const port = Number(process.env.MS_ATTENDANCE_PORT || 4002);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AttendanceStandaloneModule,
    {
      transport: Transport.TCP,
      options: { host, port },
    },
  );
  await app.listen();
  new Logger('AttendanceMicroservice').log(`Berjalan mandiri di tcp://${host}:${port}`);
}

bootstrap();

