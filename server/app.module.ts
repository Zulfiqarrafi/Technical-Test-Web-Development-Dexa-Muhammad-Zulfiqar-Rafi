import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as fs from 'fs';
import * as path from 'path';
import { DatabaseModule } from './database/database.module';
import { GatewayModule } from './gateway/gateway.module';
import { AttendanceMsModule } from './services/attendance-service/attendance-ms.module';
import { EmployeeMsModule } from './services/employee-service/employee-ms.module';

@Module({})
export class AppModule {
  static register(): DynamicModule {
    const standalone = process.env.STANDALONE_MICROSERVICES === 'true';
    const webDistDir = path.resolve(process.cwd(), 'dist', 'web');
    const hasWebBuild = fs.existsSync(path.join(webDistDir, 'index.html'));

    return {
      module: AppModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        ...(hasWebBuild
          ? [
              ServeStaticModule.forRoot({
                rootPath: webDistDir,
                exclude: ['/api/(.*)', '/uploads/(.*)'],
              }),
            ]
          : []),
        ...(standalone
          ? []
          : [DatabaseModule, EmployeeMsModule, AttendanceMsModule]),
        GatewayModule,
      ],
    };
  }
}
