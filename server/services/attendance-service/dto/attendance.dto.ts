import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitAttendanceNoteDto {
  @ApiPropertyOptional({
    example: 'Menyelesaikan modul validasi form master karyawan dan koordinasi staging',
    description: 'Catatan agenda kerja (saat masuk) atau hasil capaian kerja (saat pulang)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Catatan kerja maksimal 1000 karakter' })
  note?: string;
}

export interface ClockInPayload {
  employeeId: number;
  photoUrl: string;
  note?: string;
  ipAddress?: string;
}

export interface ClockOutPayload {
  employeeId: number;
  photoUrl?: string | null;
  note?: string;
}

export interface MyHistoryQueryPayload {
  employeeId: number;
  month?: string; // YYYY-MM
  page?: number;
  limit?: number;
}

export interface MonitorQueryPayload {
  startDate?: string;
  endDate?: string;
  departmentId?: number;
  status?: string;
  completion?: string; // WORKING | COMPLETED
  search?: string;
  page?: number;
  limit?: number;
}

