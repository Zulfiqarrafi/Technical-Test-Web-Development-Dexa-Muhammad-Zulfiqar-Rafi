import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ChangePasswordDto,
  CreateEmployeeDto,
  EmployeeQueryPayload,
  LoginDto,
  UpdateEmployeeDto,
} from './dto/employee.dto';
import { EmployeeMsService } from './employee-ms.service';

@Controller()
export class EmployeeMsController {
  constructor(private readonly service: EmployeeMsService) {}

  @MessagePattern({ cmd: 'auth.validateLogin' })
  validateLogin(@Payload() dto: LoginDto) {
    return this.service.validateLogin(dto);
  }

  @MessagePattern({ cmd: 'auth.changePassword' })
  changePassword(@Payload() payload: { employeeId: number; dto: ChangePasswordDto }) {
    return this.service.changePassword(payload.employeeId, payload.dto);
  }

  @MessagePattern({ cmd: 'departments.findAll' })
  findAllDepartments() {
    return this.service.findAllDepartments();
  }

  @MessagePattern({ cmd: 'employees.findAll' })
  findAllEmployees(@Payload() query: EmployeeQueryPayload) {
    return this.service.findAllEmployees(query);
  }

  @MessagePattern({ cmd: 'employees.findOne' })
  findOneEmployee(@Payload() payload: { id: number }) {
    return this.service.findOneEmployee(payload.id);
  }

  @MessagePattern({ cmd: 'employees.create' })
  createEmployee(@Payload() dto: CreateEmployeeDto) {
    return this.service.createEmployee(dto);
  }

  @MessagePattern({ cmd: 'employees.update' })
  updateEmployee(
    @Payload() payload: { id: number; dto: UpdateEmployeeDto; actorId: number },
  ) {
    return this.service.updateEmployee(payload.id, payload.dto, payload.actorId);
  }

  @MessagePattern({ cmd: 'employees.remove' })
  removeEmployee(@Payload() payload: { id: number; actorId: number }) {
    return this.service.removeEmployee(payload.id, payload.actorId);
  }
}

