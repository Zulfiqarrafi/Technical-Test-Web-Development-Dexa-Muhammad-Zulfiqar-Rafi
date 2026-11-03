import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from '../../database/entities/department.entity';
import { Employee } from '../../database/entities/employee.entity';
import { EmployeeMsController } from './employee-ms.controller';
import { EmployeeMsService } from './employee-ms.service';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Department])],
  controllers: [EmployeeMsController],
  providers: [EmployeeMsService],
  exports: [EmployeeMsService],
})
export class EmployeeMsModule {}

