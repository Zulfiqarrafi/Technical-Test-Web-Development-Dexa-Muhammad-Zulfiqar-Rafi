import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceStatus } from '../../common/constants';
import {
  diffMinutes,
  getJakartaDateParts,
  isLateClockIn,
} from '../../common/utils/date-time.util';
import { throwRpcError } from '../../common/utils/rpc-helper';
import { Attendance } from '../../database/entities/attendance.entity';
import { Employee } from '../../database/entities/employee.entity';
import {
  ClockInPayload,
  ClockOutPayload,
  MonitorQueryPayload,
  MyHistoryQueryPayload,
} from './dto/attendance.dto';

@Injectable()
export class AttendanceMsService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attRepo: Repository<Attendance>,
    @InjectRepository(Employee)
    private readonly empRepo: Repository<Employee>,
    private readonly config: ConfigService,
  ) {}

  private get workStartLimit(): string {
    return this.config.get<string>('WORK_START_LIMIT') || '08:30';
  }

  private sanitizeEmployee(emp?: Employee | null) {
    if (!emp) return null;
    const { passwordHash: _pw, ...rest } = emp as any;
    return rest;
  }

  private formatAttendance(att: Attendance) {
    return {
      ...att,
      employee: this.sanitizeEmployee(att.employee),
    };
  }

  async getMyTodayOverview(employeeId: number) {
    const now = new Date();
    const { dateString } = getJakartaDateParts(now);
    const currentMonthPrefix = dateString.slice(0, 7);

    const todayRecord = await this.attRepo.findOne({
      where: { employeeId, attendanceDate: dateString },
    });

    const monthRows = await this.attRepo
      .createQueryBuilder('att')
      .where('att.employeeId = :employeeId', { employeeId })
      .andWhere('att.attendanceDate LIKE :monthPrefix', {
        monthPrefix: `${currentMonthPrefix}%`,
      })
      .getMany();

    const recentLogs = await this.attRepo.find({
      where: { employeeId },
      order: { attendanceDate: 'DESC', clockInTime: 'DESC' },
      take: 5,
    });

    return {
      serverTime: now.toISOString(),
      todayDate: dateString,
      workStartLimit: this.workStartLimit,
      todayAttendance: todayRecord || null,
      monthSummary: {
        month: currentMonthPrefix,
        totalPresent: monthRows.length,
        onTime: monthRows.filter((r) => r.status === AttendanceStatus.ON_TIME).length,
        late: monthRows.filter((r) => r.status === AttendanceStatus.LATE).length,
        completedOut: monthRows.filter((r) => Boolean(r.clockOutTime)).length,
      },
      recentLogs,
    };
  }

  async clockIn(payload: ClockInPayload) {
    const employee = await this.empRepo.findOne({
      where: { id: payload.employeeId },
      relations: ['department'],
    });

    if (!employee || !employee.isActive) {
      throwRpcError(HttpStatus.FORBIDDEN, 'Data karyawan tidak aktif atau tidak ditemukan');
    }

    const now = new Date();
    const { dateString } = getJakartaDateParts(now);

    const existing = await this.attRepo.findOne({
      where: {
        employeeId: payload.employeeId,
        attendanceDate: dateString,
      },
    });

    if (existing) {
      throwRpcError(
        HttpStatus.CONFLICT,
        `Anda sudah melakukan absen masuk hari ini (${dateString})`,
      );
    }

    const late = isLateClockIn(now, this.workStartLimit);

    const created = this.attRepo.create({
      employeeId: payload.employeeId,
      attendanceDate: dateString,
      clockInTime: now,
      clockInPhoto: payload.photoUrl,
      clockInNote: payload.note?.trim() || null,
      clockInIp: payload.ipAddress || null,
      status: late ? AttendanceStatus.LATE : AttendanceStatus.ON_TIME,
    });

    const saved = await this.attRepo.save(created);
    saved.employee = employee;
    return this.formatAttendance(saved);
  }

  async clockOut(payload: ClockOutPayload) {
    const now = new Date();
    const { dateString } = getJakartaDateParts(now);

    const record = await this.attRepo.findOne({
      where: {
        employeeId: payload.employeeId,
        attendanceDate: dateString,
      },
      relations: ['employee', 'employee.department'],
    });

    if (!record) {
      throwRpcError(
        HttpStatus.BAD_REQUEST,
        'Anda belum melakukan absen masuk hari ini. Silakan absen masuk terlebih dahulu.',
      );
    }

    if (record.clockOutTime) {
      throwRpcError(
        HttpStatus.CONFLICT,
        'Anda sudah melakukan absen pulang untuk hari ini',
      );
    }

    const clockInDate =
      record.clockInTime instanceof Date
        ? record.clockInTime
        : new Date(record.clockInTime);

    record.clockOutTime = now;
    if (payload.photoUrl) {
      record.clockOutPhoto = payload.photoUrl;
    }
    if (payload.note !== undefined) {
      record.clockOutNote = payload.note.trim() || null;
    }
    record.workDurationMinutes = diffMinutes(clockInDate, now);

    const saved = await this.attRepo.save(record);
    return this.formatAttendance(saved);
  }

  async getMyHistory(query: MyHistoryQueryPayload) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 15));

    const qb = this.attRepo
      .createQueryBuilder('att')
      .where('att.employeeId = :employeeId', { employeeId: query.employeeId });

    if (query.month && /^\d{4}-\d{2}$/.test(query.month)) {
      qb.andWhere('att.attendanceDate LIKE :monthPrefix', {
        monthPrefix: `${query.month}%`,
      });
    }

    qb.orderBy('att.attendanceDate', 'DESC')
      .addOrderBy('att.clockInTime', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [rows, total] = await qb.getManyAndCount();

    return {
      data: rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getMonitorSummary(targetDate?: string) {
    const dateStr =
      targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate)
        ? targetDate
        : getJakartaDateParts(new Date()).dateString;

    const activeEmployees = await this.empRepo.find({
      where: { isActive: true },
      relations: ['department'],
      order: { nik: 'ASC' },
    });

    const dayAttendances = await this.attRepo.find({
      where: { attendanceDate: dateStr },
    });

    const presentIds = new Set(dayAttendances.map((a) => a.employeeId));
    const missingEmployees = activeEmployees
      .filter((e) => !presentIds.has(e.id))
      .map((e) => ({
        id: e.id,
        nik: e.nik,
        fullName: e.fullName,
        position: e.position,
        phone: e.phone,
        workLocation: e.workLocation,
        department: e.department
          ? { id: e.department.id, code: e.department.code, name: e.department.name }
          : null,
      }));

    // Rekapitulasi Kehadiran per Departemen
    const deptMap = new Map<number, {
      departmentId: number;
      code: string;
      name: string;
      totalEmployees: number;
      presentCount: number;
      onTimeCount: number;
      lateCount: number;
      missingCount: number;
      clockedOutCount: number;
      attendanceRate: number;
    }>();

    for (const emp of activeEmployees) {
      const deptId = emp.department?.id || emp.departmentId || 0;
      const deptCode = emp.department?.code || 'GEN';
      const deptName = emp.department?.name || 'Umum';

      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, {
          departmentId: deptId,
          code: deptCode,
          name: deptName,
          totalEmployees: 0,
          presentCount: 0,
          onTimeCount: 0,
          lateCount: 0,
          missingCount: 0,
          clockedOutCount: 0,
          attendanceRate: 0,
        });
      }

      const item = deptMap.get(deptId)!;
      item.totalEmployees += 1;

      const att = dayAttendances.find((a) => a.employeeId === emp.id);
      if (att) {
        item.presentCount += 1;
        if (att.status === AttendanceStatus.ON_TIME) {
          item.onTimeCount += 1;
        } else {
          item.lateCount += 1;
        }
        if (att.clockOutTime) {
          item.clockedOutCount += 1;
        }
      } else {
        item.missingCount += 1;
      }
    }

    const departmentBreakdown = Array.from(deptMap.values())
      .map((d) => ({
        ...d,
        attendanceRate:
          d.totalEmployees > 0
            ? Math.round((d.presentCount / d.totalEmployees) * 100)
            : 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      date: dateStr,
      totalActiveEmployees: activeEmployees.length,
      presentCount: dayAttendances.length,
      onTimeCount: dayAttendances.filter((a) => a.status === AttendanceStatus.ON_TIME)
        .length,
      lateCount: dayAttendances.filter((a) => a.status === AttendanceStatus.LATE).length,
      clockedOutCount: dayAttendances.filter((a) => Boolean(a.clockOutTime)).length,
      notYetClockedInCount: missingEmployees.length,
      departmentBreakdown,
      missingEmployees,
    };
  }

  async getMonitorList(query: MonitorQueryPayload) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(1000, Math.max(1, Number(query.limit) || 15));

    const qb = this.attRepo
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.employee', 'emp')
      .leftJoinAndSelect('emp.department', 'dept');

    if (query.startDate && /^\d{4}-\d{2}-\d{2}$/.test(query.startDate)) {
      qb.andWhere('att.attendanceDate >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate && /^\d{4}-\d{2}-\d{2}$/.test(query.endDate)) {
      qb.andWhere('att.attendanceDate <= :endDate', { endDate: query.endDate });
    }

    if (query.departmentId) {
      qb.andWhere('emp.departmentId = :deptId', { deptId: Number(query.departmentId) });
    }

    if (query.status) {
      qb.andWhere('att.status = :status', { status: query.status });
    }

    if (query.completion === 'WORKING') {
      qb.andWhere('att.clockOutTime IS NULL');
    } else if (query.completion === 'COMPLETED') {
      qb.andWhere('att.clockOutTime IS NOT NULL');
    }

    if (query.search?.trim()) {
      const kw = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(emp.fullName) LIKE :kw OR LOWER(emp.nik) LIKE :kw OR LOWER(emp.position) LIKE :kw)',
        { kw },
      );
    }

    qb.orderBy('att.attendanceDate', 'DESC')
      .addOrderBy('att.clockInTime', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [rows, total] = await qb.getManyAndCount();

    return {
      data: rows.map((r) => this.formatAttendance(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOneAttendance(id: number) {
    const row = await this.attRepo.findOne({
      where: { id },
      relations: ['employee', 'employee.department'],
    });

    if (!row) {
      throwRpcError(HttpStatus.NOT_FOUND, 'Data absensi tidak ditemukan');
    }

    return this.formatAttendance(row);
  }
}

