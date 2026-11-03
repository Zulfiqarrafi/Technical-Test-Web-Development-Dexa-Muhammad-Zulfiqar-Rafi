import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import { AttendanceStatus, UserRole } from '../common/constants';
import { getJakartaDateParts } from '../common/utils/date-time.util';
import { Attendance } from './entities/attendance.entity';
import { Department } from './entities/department.entity';
import { Employee } from './entities/employee.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    @InjectRepository(Employee)
    private readonly empRepo: Repository<Employee>,
    @InjectRepository(Attendance)
    private readonly attRepo: Repository<Attendance>,
  ) {}

  async onApplicationBootstrap() {
    const existingCount = await this.deptRepo.count();
    if (existingCount > 0) {
      return;
    }

    this.logger.log('Menginisialisasi data awal departemen, karyawan, dan sampel presensi...');

    const departments = await this.deptRepo.save([
      {
        code: 'HC',
        name: 'Human Capital',
        description: 'Pengelolaan SDM, rekrutmen, dan operasional kepegawaian',
      },
      {
        code: 'ITD',
        name: 'IT & Digital',
        description: 'Pengembangan aplikasi internal, infrastruktur, dan sistem informasi',
      },
      {
        code: 'QA',
        name: 'Quality Assurance',
        description: 'Standarisasi mutu produk farmasi dan kepatuhan regulasi',
      },
      {
        code: 'RND',
        name: 'Research & Development',
        description: 'Riset formulasi dan pengembangan produk kesehatan',
      },
      {
        code: 'SCM',
        name: 'Supply Chain Management',
        description: 'Perencanaan pengadaan, logistik, dan distribusi nasional',
      },
      {
        code: 'FIN',
        name: 'Finance & Accounting',
        description: 'Keuangan korporat, akuntansi, dan perpajakan',
      },
    ]);

    const deptByCode = Object.fromEntries(departments.map((d) => [d.code, d]));
    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    const employees = await this.empRepo.save([
      {
        nik: 'DXG-21001',
        fullName: 'Ratna Kusumawardhani',
        email: 'hrd@dexagroup.com',
        passwordHash: defaultPasswordHash,
        phone: '081288001101',
        position: 'HR Operations Specialist',
        departmentId: deptByCode.HC.id,
        role: UserRole.HRD,
        workLocation: 'Bintaro Sektor 9, Tangerang Selatan',
        joinDate: '2021-03-15',
        isActive: true,
      },
      {
        nik: 'DXG-22014',
        fullName: 'Budi Santoso',
        email: 'budi.santoso@dexagroup.com',
        passwordHash: defaultPasswordHash,
        phone: '081382910022',
        position: 'Fullstack Software Engineer',
        departmentId: deptByCode.ITD.id,
        role: UserRole.EMPLOYEE,
        workLocation: 'BSD City, Tangerang',
        joinDate: '2022-06-01',
        isActive: true,
      },
      {
        nik: 'DXG-22038',
        fullName: 'Siti Rahmawati',
        email: 'siti.rahmawati@dexagroup.com',
        passwordHash: defaultPasswordHash,
        phone: '081290114433',
        position: 'QA Compliance Analyst',
        departmentId: deptByCode.QA.id,
        role: UserRole.EMPLOYEE,
        workLocation: 'Kelapa Gading, Jakarta Utara',
        joinDate: '2022-09-12',
        isActive: true,
      },
      {
        nik: 'DXG-23012',
        fullName: 'Andi Pratama',
        email: 'andi.pratama@dexagroup.com',
        passwordHash: defaultPasswordHash,
        phone: '085711229980',
        position: 'Formulation Research Associate',
        departmentId: deptByCode.RND.id,
        role: UserRole.EMPLOYEE,
        workLocation: 'Cikarang Selatan, Bekasi',
        joinDate: '2023-01-16',
        isActive: true,
      },
      {
        nik: 'DXG-23045',
        fullName: 'Nadia Maharani',
        email: 'nadia.maharani@dexagroup.com',
        passwordHash: defaultPasswordHash,
        phone: '08117890231',
        position: 'Supply Chain Planner',
        departmentId: deptByCode.SCM.id,
        role: UserRole.EMPLOYEE,
        workLocation: 'Ilir Timur, Palembang',
        joinDate: '2023-07-03',
        isActive: true,
      },
      {
        nik: 'DXG-24009',
        fullName: 'Rizkyiansyah Putra',
        email: 'rizky.putra@dexagroup.com',
        passwordHash: defaultPasswordHash,
        phone: '082199884120',
        position: 'Cost Accounting Officer',
        departmentId: deptByCode.FIN.id,
        role: UserRole.EMPLOYEE,
        workLocation: 'Beji, Depok',
        joinDate: '2024-02-05',
        isActive: true,
      },
      {
        nik: 'DXG-24021',
        fullName: 'Dimas Arya Wijaya',
        email: 'dimas.wijaya@dexagroup.com',
        passwordHash: defaultPasswordHash,
        phone: '081377661090',
        position: 'Backend Engineer',
        departmentId: deptByCode.ITD.id,
        role: UserRole.EMPLOYEE,
        workLocation: 'Bekasi Barat, Kota Bekasi',
        joinDate: '2024-05-20',
        isActive: true,
      },
    ]);

    const empByNik = Object.fromEntries(employees.map((e) => [e.nik, e]));
    await this.seedSampleAttendances(empByNik);
    this.logger.log('Inisialisasi data awal selesai.');
  }

  private createSampleProofSvg(
    filename: string,
    fullName: string,
    nik: string,
    timestampLabel: string,
    location: string,
    mode: 'MASUK' | 'PULANG',
  ): string {
    const uploadDir = path.resolve(process.cwd(), 'uploads', 'attendance');
    fs.mkdirSync(uploadDir, { recursive: true });
    const fullPath = path.join(uploadDir, filename);

    const accent = mode === 'MASUK' ? '#15803d' : '#1d4ed8';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="480" viewBox="0 0 720 480">
  <rect width="720" height="480" fill="#e5e7eb"/>
  <rect x="40" y="36" width="640" height="340" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  <rect x="210" y="110" width="300" height="185" rx="6" fill="#1e293b"/>
  <rect x="222" y="122" width="276" height="156" rx="3" fill="#0f172a"/>
  <rect x="242" y="142" width="120" height="12" rx="2" fill="#334155"/>
  <rect x="242" y="164" width="220" height="8" rx="2" fill="#475569"/>
  <rect x="242" y="180" width="190" height="8" rx="2" fill="#475569"/>
  <rect x="242" y="196" width="210" height="8" rx="2" fill="#334155"/>
  <rect x="242" y="220" width="90" height="28" rx="4" fill="#991b1b"/>
  <path d="M185 295 L535 295 L560 322 L160 322 Z" fill="#94a3b8"/>
  <rect x="570" y="245" width="46" height="52" rx="6" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
  <path d="M616 258 C632 258 632 284 616 284" fill="none" stroke="#94a3b8" stroke-width="4"/>
  <rect x="0" y="392" width="720" height="88" fill="#111827" fill-opacity="0.92"/>
  <rect x="24" y="408" width="108" height="24" rx="4" fill="${accent}"/>
  <text x="78" y="424" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff">ABSEN ${mode}</text>
  <text x="146" y="425" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#f9fafb">${fullName} (${nik})</text>
  <text x="24" y="454" font-family="monospace" font-size="13" fill="#cbd5e1">${timestampLabel} WIB  |  Lokasi WFH: ${location}</text>
</svg>`;

    fs.writeFileSync(fullPath, svg, 'utf8');
    return `/uploads/attendance/${filename}`;
  }

  private buildWibDate(daysOffset: number, hour: number, minute: number): { dateStr: string; dt: Date; label: string } {
    const base = new Date();
    base.setDate(base.getDate() + daysOffset);
    const { dateString } = getJakartaDateParts(base);
    const hh = String(hour).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    const dt = new Date(`${dateString}T${hh}:${mm}:18+07:00`);
    return {
      dateStr: dateString,
      dt,
      label: `${dateString} ${hh}:${mm}:18`,
    };
  }

  private async seedSampleAttendances(empByNik: Record<string, Employee>) {
    const records: Partial<Attendance>[] = [];

    // Riwayat 2 hari lalu & kemarin untuk Budi Santoso (hari ini sengaja dikosongkan untuk demo absen live)
    const budi = empByNik['DXG-22014'];
    for (const [offset, inH, inM, outH, outM, noteIn, noteOut] of [
      [
        -2,
        8,
        12,
        17,
        18,
        'Integrasi endpoint master karyawan dan validasi input form HRIS',
        'Seluruh endpoint CRUD karyawan selesai diuji pada environment staging',
      ],
      [
        -1,
        8,
        21,
        17,
        35,
        'Implementasi modul upload bukti foto WFH dan optimasi query laporan',
        'Fitur kompresi & validasi ukuran foto WFH selesai dikerjakan',
      ],
    ] as const) {
      const clockIn = this.buildWibDate(offset, inH, inM);
      const clockOut = this.buildWibDate(offset, outH, outM);
      records.push({
        employeeId: budi.id,
        attendanceDate: clockIn.dateStr,
        clockInTime: clockIn.dt,
        clockInPhoto: this.createSampleProofSvg(
          `seed-budi-${clockIn.dateStr}-in.svg`,
          budi.fullName,
          budi.nik,
          clockIn.label,
          budi.workLocation || 'Tangerang',
          'MASUK',
        ),
        clockInNote: noteIn,
        clockInIp: '114.124.210.44',
        clockOutTime: clockOut.dt,
        clockOutPhoto: this.createSampleProofSvg(
          `seed-budi-${clockOut.dateStr}-out.svg`,
          budi.fullName,
          budi.nik,
          clockOut.label,
          budi.workLocation || 'Tangerang',
          'PULANG',
        ),
        clockOutNote: noteOut,
        status: AttendanceStatus.ON_TIME,
        workDurationMinutes: (outH * 60 + outM) - (inH * 60 + inM),
      });
    }

    // Data absensi hari ini untuk beberapa karyawan lain agar dashboard Monitoring HRD langsung terisi
    const todayEntries = [
      {
        emp: empByNik['DXG-22038'],
        inH: 8,
        inM: 8,
        status: AttendanceStatus.ON_TIME,
        note: 'Review dokumen SOP validasi batch produksi kuartal IV',
        ip: '180.252.89.12',
      },
      {
        emp: empByNik['DXG-23012'],
        inH: 8,
        inM: 19,
        status: AttendanceStatus.ON_TIME,
        note: 'Penyusunan laporan uji stabilitas sediaan tablet salut selaput',
        ip: '36.72.214.90',
      },
      {
        emp: empByNik['DXG-23045'],
        inH: 8,
        inM: 44,
        status: AttendanceStatus.LATE,
        note: 'Rekonsiliasi jadwal distribusi cabang Sumatera Selatan & Lampung',
        ip: '110.137.41.88',
      },
    ];

    for (const item of todayEntries) {
      const clockIn = this.buildWibDate(0, item.inH, item.inM);
      records.push({
        employeeId: item.emp.id,
        attendanceDate: clockIn.dateStr,
        clockInTime: clockIn.dt,
        clockInPhoto: this.createSampleProofSvg(
          `seed-${item.emp.nik.toLowerCase()}-${clockIn.dateStr}-in.svg`,
          item.emp.fullName,
          item.emp.nik,
          clockIn.label,
          item.emp.workLocation || 'Indonesia',
          'MASUK',
        ),
        clockInNote: item.note,
        clockInIp: item.ip,
        status: item.status,
      });
    }

    // Tambahan data kemarin untuk Siti & Rizky
    for (const [nik, inH, inM, outH, outM, st, noteIn, noteOut] of [
      [
        'DXG-22038',
        8,
        5,
        17,
        10,
        AttendanceStatus.ON_TIME,
        'Audit internal dokumen CAPA divisi manufaktur',
        'Rekap temuan audit internal telah dikirim ke kepala QA',
      ],
      [
        'DXG-24009',
        8,
        39,
        17,
        45,
        AttendanceStatus.LATE,
        'Verifikasi jurnal biaya bahan baku bulan berjalan',
        'Laporan varian harga pokok produksi selesai diverifikasi',
      ],
    ] as const) {
      const emp = empByNik[nik];
      const clockIn = this.buildWibDate(-1, inH, inM);
      const clockOut = this.buildWibDate(-1, outH, outM);
      records.push({
        employeeId: emp.id,
        attendanceDate: clockIn.dateStr,
        clockInTime: clockIn.dt,
        clockInPhoto: this.createSampleProofSvg(
          `seed-${emp.nik.toLowerCase()}-${clockIn.dateStr}-in.svg`,
          emp.fullName,
          emp.nik,
          clockIn.label,
          emp.workLocation || 'Indonesia',
          'MASUK',
        ),
        clockInNote: noteIn,
        clockInIp: '118.99.72.15',
        clockOutTime: clockOut.dt,
        clockOutPhoto: this.createSampleProofSvg(
          `seed-${emp.nik.toLowerCase()}-${clockOut.dateStr}-out.svg`,
          emp.fullName,
          emp.nik,
          clockOut.label,
          emp.workLocation || 'Indonesia',
          'PULANG',
        ),
        clockOutNote: noteOut,
        status: st,
        workDurationMinutes: (outH * 60 + outM) - (inH * 60 + inM),
      });
    }

    await this.attRepo.save(records);
  }
}

