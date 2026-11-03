import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import * as fs from 'fs';
import {
  ATTENDANCE_SERVICE,
  JwtUserPayload,
  UserRole,
} from '../../common/constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { sendRpc } from '../../common/utils/rpc-helper';
import { SubmitAttendanceNoteDto } from '../../services/attendance-service/dto/attendance.dto';
import { attendanceUploadOptions } from './upload.config';

@ApiTags('Presensi WFH & Monitoring HRD')
@ApiBearerAuth()
@Controller('api/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(
    @Inject(ATTENDANCE_SERVICE)
    private readonly attendanceClient: ClientProxy,
  ) {}

  private cleanupUploadedFile(file?: Express.Multer.File) {
    if (file?.path && fs.existsSync(file.path)) {
      fs.unlink(file.path, () => undefined);
    }
  }

  private extractClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || req.ip || '127.0.0.1';
  }

  @Get('today')
  @ApiOperation({
    summary: 'Status Presensi Hari Ini (Karyawan Aktif)',
    description: 'Mengambil waktu server WIB, batas jam masuk kerja, status absensi hari ini, serta rekap bulan berjalan.',
  })
  getMyToday(@CurrentUser() user: JwtUserPayload) {
    return sendRpc(this.attendanceClient, 'attendance.myToday', {
      employeeId: user.sub,
    });
  }

  @Post('clock-in')
  @UseInterceptors(FileInterceptor('photo', attendanceUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Absen Masuk WFH + Upload Foto Bukti',
    description: 'Mencatat presensi masuk karyawan menggunakan timestamp server WIB dan bukti foto bekerja di rumah.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['photo'],
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
          description: 'File foto bukti bekerja dari rumah (JPG, PNG, atau WEBP maks. 5 MB)',
        },
        note: {
          type: 'string',
          description: 'Catatan agenda / rencana kerja hari ini',
        },
      },
    },
  })
  async clockIn(
    @CurrentUser() user: JwtUserPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: SubmitAttendanceNoteDto,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Foto bukti bekerja dari rumah (WFH) wajib diunggah saat absen masuk',
      );
    }

    try {
      const photoUrl = `/uploads/attendance/${file.filename}`;
      return await sendRpc(this.attendanceClient, 'attendance.clockIn', {
        employeeId: user.sub,
        photoUrl,
        note: body.note,
        ipAddress: this.extractClientIp(req),
      });
    } catch (err) {
      this.cleanupUploadedFile(file);
      throw err;
    }
  }

  @Post('clock-out')
  @UseInterceptors(FileInterceptor('photo', attendanceUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Absen Pulang WFH + Ringkasan Capaian',
    description: 'Mencatat jam pulang kerja, kalkulasi total durasi kerja harian, dan ringkasan pekerjaan yang telah diselesaikan.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
          description: 'File foto penutupan kerja (opsional)',
        },
        note: {
          type: 'string',
          description: 'Ringkasan pekerjaan yang telah diselesaikan',
        },
      },
    },
  })
  async clockOut(
    @CurrentUser() user: JwtUserPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: SubmitAttendanceNoteDto,
  ) {
    try {
      const photoUrl = file ? `/uploads/attendance/${file.filename}` : null;
      return await sendRpc(this.attendanceClient, 'attendance.clockOut', {
        employeeId: user.sub,
        photoUrl,
        note: body.note,
      });
    } catch (err) {
      this.cleanupUploadedFile(file);
      throw err;
    }
  }

  @Get('my-history')
  @ApiOperation({
    summary: 'Riwayat Presensi Pribadi',
    description: 'Mengambil daftar riwayat presensi karyawan yang sedang login dengan filter bulan (YYYY-MM).',
  })
  @ApiQuery({ name: 'month', required: false, example: '2026-11' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 15 })
  getMyHistory(
    @CurrentUser() user: JwtUserPayload,
    @Query('month') month?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return sendRpc(this.attendanceClient, 'attendance.myHistory', {
      employeeId: user.sub,
      month,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 15,
    });
  }

  // ==========================================================================
  // HRD MONITORING ENDPOINTS (VIEW-ONLY CONTROL SESUAI SPESIFIKASI)
  // ==========================================================================

  @Get('monitoring/summary')
  @Roles(UserRole.HRD)
  @ApiOperation({
    summary: 'Ringkasan Monitoring Kehadiran Harian & Breakdown Departemen (Khusus HRD)',
    description: 'Menyajikan total kehadiran hari ini, status tepat waktu vs terlambat, rekapitulasi per divisi, dan daftar karyawan aktif yang belum absen.',
  })
  @ApiQuery({ name: 'date', required: false, description: 'Tanggal spesifik YYYY-MM-DD' })
  getMonitorSummary(@Query('date') date?: string) {
    return sendRpc(this.attendanceClient, 'attendance.monitorSummary', { date });
  }

  @Get('monitoring')
  @Roles(UserRole.HRD)
  @ApiOperation({
    summary: 'Kontrol Daftar Presensi Karyawan — View Only (Khusus HRD)',
    description: 'Melihat seluruh presensi yang telah disubmit karyawan beserta catatan dan bukti foto.',
  })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['ON_TIME', 'LATE'] })
  @ApiQuery({ name: 'completion', required: false, enum: ['WORKING', 'COMPLETED'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 15 })
  getMonitorList(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
    @Query('completion') completion?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return sendRpc(this.attendanceClient, 'attendance.monitorList', {
      startDate,
      endDate,
      departmentId: departmentId ? Number(departmentId) : undefined,
      status,
      completion,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 15,
    });
  }

  @Get('monitoring/:id')
  @Roles(UserRole.HRD)
  @ApiOperation({
    summary: 'Detail Presensi Tertentu (View Only)',
    description: 'Inspeksi detail rekaman presensi tunggal beserta tautan bukti foto ukuran penuh.',
  })
  getMonitorDetail(@Param('id', ParseIntPipe) id: number) {
    return sendRpc(this.attendanceClient, 'attendance.findOne', { id });
  }
}

