import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DatabaseModule } from './database/database.module';
import { EmployeeMsModule } from './services/employee-service/employee-ms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    EmployeeMsModule,
  ],
})
class EmployeeStandaloneModule {}

async function bootstrap() {
  const host = process.env.MS_EMPLOYEE_HOST || '127.0.0.1';
  const port = Number(process.env.MS_EMPLOYEE_PORT || 4001);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    EmployeeStandaloneModule,
    {
      transport: Transport.TCP,
      options: { host, port },
    },
  );
  await app.listen();
  new Logger('EmployeeMicroservice').log(`Berjalan mandiri di tcp://${host}:${port}`);
}

bootstrap();

