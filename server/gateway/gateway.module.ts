import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { ATTENDANCE_SERVICE, EMPLOYEE_SERVICE } from '../common/constants';
import { AttendanceController } from './attendance/attendance.controller';
import { AuthController } from './auth/auth.controller';
import { JwtStrategy } from './auth/jwt.strategy';
import { EmployeesController } from './employees/employees.controller';
import { HealthController } from './health.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'dexa-hris-wfh-internal-secret-2026',
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') || '12h') as any,
        },
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: EMPLOYEE_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('MS_EMPLOYEE_HOST') || '127.0.0.1',
            port: Number(config.get<string>('MS_EMPLOYEE_PORT') || 4001),
          },
        }),
      },
      {
        name: ATTENDANCE_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('MS_ATTENDANCE_HOST') || '127.0.0.1',
            port: Number(config.get<string>('MS_ATTENDANCE_PORT') || 4002),
          },
        }),
      },
    ]),
  ],
  controllers: [
    HealthController,
    AuthController,
    EmployeesController,
    AttendanceController,
  ],
  providers: [JwtStrategy],
})
export class GatewayModule {}

