import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('System & Health')
@Controller('api/health')
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  @ApiOperation({
    summary: 'Cek Status & Topologi Microservices',
    description: 'Menampilkan status operasional API Gateway serta endpoint TCP Microservices aktif.',
  })
  check() {
    return {
      status: 'ok',
      architecture: 'NestJS API Gateway + TCP Microservices',
      services: {
        gateway: `http://127.0.0.1:${this.config.get('PORT') || 3000}`,
        employeeService: `tcp://${this.config.get('MS_EMPLOYEE_HOST') || '127.0.0.1'}:${this.config.get('MS_EMPLOYEE_PORT') || 4001}`,
        attendanceService: `tcp://${this.config.get('MS_ATTENDANCE_HOST') || '127.0.0.1'}:${this.config.get('MS_ATTENDANCE_PORT') || 4002}`,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

