import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { throwRpcError } from '../../common/utils/rpc-helper';
import { Department } from '../../database/entities/department.entity';
import { Employee } from '../../database/entities/employee.entity';
import {
  ChangePasswordDto,
  CreateEmployeeDto,
  EmployeeQueryPayload,
  LoginDto,
  UpdateEmployeeDto,
} from './dto/employee.dto';

@Injectable()
export class EmployeeMsService {
  constructor(
    @InjectRepository(Employee)
    private readonly empRepo: Repository<Employee>,
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
  ) {}

  private sanitize(emp: Employee) {
    const { passwordHash: _pw, ...safe } = emp as any;
    return safe;
  }

  async validateLogin(dto: LoginDto) {
    const identifier = dto.identifier.trim();
    const employee = await this.empRepo
      .createQueryBuilder('emp')
      .addSelect('emp.passwordHash')
      .leftJoinAndSelect('emp.department', 'dept')
      .where('LOWER(emp.email) = LOWER(:identifier)', { identifier })
      .orWhere('LOWER(emp.nik) = LOWER(:identifier)', { identifier })
      .getOne();

    if (!employee) {
      throwRpcError(HttpStatus.UNAUTHORIZED, 'Email/NIK atau password tidak sesuai');
    }

    if (!employee.isActive) {
      throwRpcError(
        HttpStatus.FORBIDDEN,
        'Akun karyawan berstatus nonaktif. Silakan hubungi bagian HRD.',
      );
    }

    const passwordValid = await bcrypt.compare(dto.password, employee.passwordHash);
    if (!passwordValid) {
      throwRpcError(HttpStatus.UNAUTHORIZED, 'Email/NIK atau password tidak sesuai');
    }

    return this.sanitize(employee);
  }

  async changePassword(employeeId: number, dto: ChangePasswordDto) {
    const employee = await this.empRepo
      .createQueryBuilder('emp')
      .addSelect('emp.passwordHash')
      .where('emp.id = :id', { id: employeeId })
      .getOne();

    if (!employee) {
      throwRpcError(HttpStatus.NOT_FOUND, 'Data karyawan tidak ditemukan');
    }

    const match = await bcrypt.compare(dto.currentPassword, employee.passwordHash);
    if (!match) {
      throwRpcError(HttpStatus.BAD_REQUEST, 'Password saat ini tidak sesuai');
    }

    employee.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.empRepo.save(employee);

    return { message: 'Password berhasil diperbarui' };
  }

  async findAllDepartments() {
    return this.deptRepo.find({
      order: { name: 'ASC' },
    });
  }

  async findAllEmployees(query: EmployeeQueryPayload) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const qb = this.empRepo
      .createQueryBuilder('emp')
      .leftJoinAndSelect('emp.department', 'dept');

    if (query.search?.trim()) {
      const kw = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(emp.fullName) LIKE :kw OR LOWER(emp.nik) LIKE :kw OR LOWER(emp.email) LIKE :kw OR LOWER(emp.position) LIKE :kw)',
        { kw },
      );
    }

    if (query.departmentId) {
      qb.andWhere('emp.departmentId = :deptId', { deptId: Number(query.departmentId) });
    }

    if (query.role) {
      qb.andWhere('emp.role = :role', { role: query.role });
    }

    if (query.isActive === 'true' || query.isActive === 'false') {
      qb.andWhere('emp.isActive = :active', { active: query.isActive === 'true' });
    }

    qb.orderBy('emp.nik', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [rows, total] = await qb.getManyAndCount();

    return {
      data: rows.map((r) => this.sanitize(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOneEmployee(id: number) {
    const emp = await this.empRepo.findOne({
      where: { id },
      relations: ['department'],
    });

    if (!emp) {
      throwRpcError(HttpStatus.NOT_FOUND, 'Data karyawan tidak ditemukan');
    }

    return this.sanitize(emp);
  }

  async createEmployee(dto: CreateEmployeeDto) {
    const nikNormalized = dto.nik.trim().toUpperCase();
    const emailNormalized = dto.email.trim().toLowerCase();

    const dept = await this.deptRepo.findOne({ where: { id: dto.departmentId } });
    if (!dept) {
      throwRpcError(HttpStatus.BAD_REQUEST, 'Departemen yang dipilih tidak ditemukan');
    }

    const existingNik = await this.empRepo
      .createQueryBuilder('emp')
      .where('LOWER(emp.nik) = LOWER(:nik)', { nik: nikNormalized })
      .getOne();
    if (existingNik) {
      throwRpcError(HttpStatus.CONFLICT, `NIK ${nikNormalized} sudah terdaftar`);
    }

    const existingEmail = await this.empRepo
      .createQueryBuilder('emp')
      .where('LOWER(emp.email) = LOWER(:email)', { email: emailNormalized })
      .getOne();
    if (existingEmail) {
      throwRpcError(HttpStatus.CONFLICT, `Email ${emailNormalized} sudah digunakan`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = this.empRepo.create({
      nik: nikNormalized,
      fullName: dto.fullName.trim(),
      email: emailNormalized,
      passwordHash,
      phone: dto.phone?.trim() || null,
      position: dto.position.trim(),
      departmentId: dto.departmentId,
      role: dto.role,
      workLocation: dto.workLocation?.trim() || null,
      joinDate: dto.joinDate,
      isActive: dto.isActive ?? true,
    });

    const saved = await this.empRepo.save(created);
    return this.findOneEmployee(saved.id);
  }

  async updateEmployee(id: number, dto: UpdateEmployeeDto, actorId: number) {
    const emp = await this.empRepo.findOne({ where: { id } });
    if (!emp) {
      throwRpcError(HttpStatus.NOT_FOUND, 'Data karyawan tidak ditemukan');
    }

    if (id === actorId && dto.isActive === false) {
      throwRpcError(
        HttpStatus.BAD_REQUEST,
        'Anda tidak dapat menonaktifkan akun yang sedang digunakan',
      );
    }

    if (dto.nik !== undefined) {
      const nikNormalized = dto.nik.trim().toUpperCase();
      const dupNik = await this.empRepo
        .createQueryBuilder('e')
        .where('LOWER(e.nik) = LOWER(:nik) AND e.id != :id', { nik: nikNormalized, id })
        .getOne();
      if (dupNik) {
        throwRpcError(HttpStatus.CONFLICT, `NIK ${nikNormalized} sudah terdaftar pada karyawan lain`);
      }
      emp.nik = nikNormalized;
    }

    if (dto.email !== undefined) {
      const emailNormalized = dto.email.trim().toLowerCase();
      const dupEmail = await this.empRepo
        .createQueryBuilder('e')
        .where('LOWER(e.email) = LOWER(:email) AND e.id != :id', {
          email: emailNormalized,
          id,
        })
        .getOne();
      if (dupEmail) {
        throwRpcError(
          HttpStatus.CONFLICT,
          `Email ${emailNormalized} sudah digunakan oleh karyawan lain`,
        );
      }
      emp.email = emailNormalized;
    }

    if (dto.departmentId !== undefined) {
      const dept = await this.deptRepo.findOne({ where: { id: dto.departmentId } });
      if (!dept) {
        throwRpcError(HttpStatus.BAD_REQUEST, 'Departemen tidak valid');
      }
      emp.departmentId = dto.departmentId;
      emp.department = dept;
    }

    if (dto.fullName !== undefined) emp.fullName = dto.fullName.trim();
    if (dto.phone !== undefined) emp.phone = dto.phone.trim() || null;
    if (dto.position !== undefined) emp.position = dto.position.trim();
    if (dto.role !== undefined) emp.role = dto.role;
    if (dto.workLocation !== undefined) emp.workLocation = dto.workLocation.trim() || null;
    if (dto.joinDate !== undefined) emp.joinDate = dto.joinDate;
    if (dto.isActive !== undefined) emp.isActive = dto.isActive;

    if (dto.password && dto.password.trim().length > 0) {
      emp.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    await this.empRepo.save(emp);
    return this.findOneEmployee(id);
  }

  async removeEmployee(id: number, actorId: number) {
    if (id === actorId) {
      throwRpcError(
        HttpStatus.BAD_REQUEST,
        'Anda tidak dapat menghapus akun yang sedang digunakan',
      );
    }

    const emp = await this.empRepo.findOne({ where: { id } });
    if (!emp) {
      throwRpcError(HttpStatus.NOT_FOUND, 'Data karyawan tidak ditemukan');
    }

    await this.empRepo.remove(emp);
    return {
      id,
      message: `Data karyawan ${emp.fullName} (${emp.nik}) berhasil dihapus`,
    };
  }
}

