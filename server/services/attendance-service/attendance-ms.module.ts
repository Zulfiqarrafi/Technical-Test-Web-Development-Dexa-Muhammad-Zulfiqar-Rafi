import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '../../database/entities/attendance.entity';
import { Employee } from '../../database/entities/employee.entity';
import { AttendanceMsController } from './attendance-ms.controller';
import { AttendanceMsService } from './attendance-ms.service';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, Employee])],
  controllers: [AttendanceMsController],
  providers: [AttendanceMsService],
  exports: [AttendanceMsService],
})
export class AttendanceMsModule {}

