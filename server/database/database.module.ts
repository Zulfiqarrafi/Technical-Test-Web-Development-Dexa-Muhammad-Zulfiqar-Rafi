import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as mysql from 'mysql2/promise';
import * as path from 'path';
import { Attendance } from './entities/attendance.entity';
import { Department } from './entities/department.entity';
import { Employee } from './entities/employee.entity';
import { SeedService } from './seed.service';

const logger = new Logger('DatabaseModule');
const ENTITIES = [Department, Employee, Attendance];

function buildLocalSqlJsOptions(synchronize: boolean): TypeOrmModuleOptions {
  const sqlFile = path.resolve(process.cwd(), 'database', 'dexa_wfh.sqlite');
  const existingData = fs.existsSync(sqlFile) ? fs.readFileSync(sqlFile) : undefined;

  return {
    type: 'sqljs',
    database: existingData,
    autoSave: true,
    autoSaveCallback: (data: Uint8Array) => {
      fs.mkdirSync(path.dirname(sqlFile), { recursive: true });
      fs.writeFileSync(sqlFile, Buffer.from(data));
    },
    entities: ENTITIES,
    synchronize,
  };
}

async function ensureMysqlDatabase(
  host: string,
  port: number,
  user: string,
  password: string,
  database: string,
): Promise<boolean> {
  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      connectTimeout: 2500,
    });
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    );
    return true;
  } catch {
    return false;
  } finally {
    if (conn) {
      await conn.end().catch(() => undefined);
    }
  }
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<TypeOrmModuleOptions> => {
        const dbType = (config.get<string>('DB_TYPE') || 'mysql').toLowerCase();
        const host = config.get<string>('DB_HOST') || '127.0.0.1';
        const port = Number(config.get<string>('DB_PORT') || 3306);
        const username = config.get<string>('DB_USERNAME') || 'root';
        const password = config.get<string>('DB_PASSWORD') || '';
        const database = config.get<string>('DB_DATABASE') || 'dexa_wfh_db';
        const synchronize = config.get<string>('DB_SYNCHRONIZE') !== 'false';
        const fallbackLocal = config.get<string>('DB_FALLBACK_LOCAL') !== 'false';

        if (dbType === 'sqlite' || dbType === 'sqljs') {
          logger.log('Menggunakan embedded SQL database (database/dexa_wfh.sqlite)');
          return buildLocalSqlJsOptions(synchronize);
        }

        if (dbType === 'mysql' || dbType === 'mariadb') {
          const reachable = await ensureMysqlDatabase(
            host,
            port,
            username,
            password,
            database,
          );

          if (!reachable && fallbackLocal) {
            logger.warn(
              `MySQL (${host}:${port}) belum aktif. Beralih otomatis ke SQLite lokal (database/dexa_wfh.sqlite). ` +
                `Aktifkan MySQL untuk langsung menggunakan database ${database}.`,
            );
            return buildLocalSqlJsOptions(synchronize);
          }

          logger.log(`Terhubung ke database MySQL ${host}:${port}/${database}`);
          return {
            type: 'mysql',
            host,
            port,
            username,
            password,
            database,
            entities: ENTITIES,
            synchronize,
            timezone: '+07:00',
            charset: 'utf8mb4',
          };
        }

        if (dbType === 'oracle') {
          const serviceName = config.get<string>('DB_SERVICE_NAME') || 'XEPDB1';
          logger.log(`Terhubung ke Oracle Database ${host}:${port}/${serviceName}`);
          return {
            type: 'oracle',
            host,
            port: Number(config.get<string>('DB_PORT') || 1521),
            username,
            password,
            serviceName,
            entities: ENTITIES,
            synchronize,
          };
        }

        if (dbType === 'postgres') {
          logger.log(`Terhubung ke PostgreSQL ${host}:${port}/${database}`);
          return {
            type: 'postgres',
            host,
            port: Number(config.get<string>('DB_PORT') || 5432),
            username,
            password,
            database,
            entities: ENTITIES,
            synchronize,
          };
        }

        if (dbType === 'mssql') {
          logger.log(`Terhubung ke SQL Server ${host}:${port}/${database}`);
          return {
            type: 'mssql',
            host,
            port: Number(config.get<string>('DB_PORT') || 1433),
            username,
            password,
            database,
            entities: ENTITIES,
            synchronize,
            options: { encrypt: false, trustServerCertificate: true },
          };
        }

        throw new Error(`DB_TYPE "${dbType}" tidak dikenali.`);
      },
    }),
    TypeOrmModule.forFeature(ENTITIES),
  ],
  providers: [SeedService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

