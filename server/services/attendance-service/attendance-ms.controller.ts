import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AttendanceMsService } from './attendance-ms.service';
import {
  ClockInPayload,
  ClockOutPayload,
  MonitorQueryPayload,
  MyHistoryQueryPayload,
} from './dto/attendance.dto';

@Controller()
export class AttendanceMsController {
  constructor(private readonly service: AttendanceMsService) {}

  @MessagePattern({ cmd: 'attendance.myToday' })
  getMyToday(@Payload() payload: { employeeId: number }) {
    return this.service.getMyTodayOverview(payload.employeeId);
  }

  @MessagePattern({ cmd: 'attendance.clockIn' })
  clockIn(@Payload() payload: ClockInPayload) {
    return this.service.clockIn(payload);
  }

  @MessagePattern({ cmd: 'attendance.clockOut' })
  clockOut(@Payload() payload: ClockOutPayload) {
    return this.service.clockOut(payload);
  }

  @MessagePattern({ cmd: 'attendance.myHistory' })
  getMyHistory(@Payload() query: MyHistoryQueryPayload) {
    return this.service.getMyHistory(query);
  }

  @MessagePattern({ cmd: 'attendance.monitorSummary' })
  getMonitorSummary(@Payload() payload: { date?: string }) {
    return this.service.getMonitorSummary(payload.date);
  }

  @MessagePattern({ cmd: 'attendance.monitorList' })
  getMonitorList(@Payload() query: MonitorQueryPayload) {
    return this.service.getMonitorList(query);
  }

  @MessagePattern({ cmd: 'attendance.findOne' })
  findOne(@Payload() payload: { id: number }) {
    return this.service.findOneAttendance(payload.id);
  }
}

