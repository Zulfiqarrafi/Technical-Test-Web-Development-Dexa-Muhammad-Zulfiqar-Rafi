import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  EMPLOYEE_SERVICE,
  JwtUserPayload,
  UserRole,
} from '../../common/constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { sendRpc } from '../../common/utils/rpc-helper';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from '../../services/employee-service/dto/employee.dto';

@ApiTags('Master Data Karyawan & Departemen')
@ApiBearerAuth()
@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(
    @Inject(EMPLOYEE_SERVICE)
    private readonly employeeClient: ClientProxy,
  ) {}

  @Get('departments')
  @ApiOperation({
    summary: 'Daftar Master Departemen',
    description: 'Mengambil seluruh master data divisi / departemen perusahaan (Human Capital, IT, QA, R&D, dll).',
  })
  findAllDepartments() {
    return sendRpc(this.employeeClient, 'departments.findAll');
  }

  @Get('employees')
  @Roles(UserRole.HRD)
  @ApiOperation({
    summary: 'Daftar Master Karyawan (Khusus HRD)',
    description: 'Mengambil daftar seluruh karyawan dengan dukungan pencarian kata kunci, filter departemen, filter status kerja, dan paginasi.',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Kata kunci nama, NIK, email, atau jabatan' })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  findAll(
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return sendRpc(this.employeeClient, 'employees.findAll', {
      search,
      departmentId: departmentId ? Number(departmentId) : undefined,
      role,
      isActive,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });
  }

  @Get('employees/:id')
  @Roles(UserRole.HRD)
  @ApiOperation({
    summary: 'Detail Karyawan Berdasarkan ID',
    description: 'Mengambil detail profil lengkap karyawan dan relasi departemennya.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return sendRpc(this.employeeClient, 'employees.findOne', { id });
  }

  @Post('employees')
  @Roles(UserRole.HRD)
  @ApiOperation({
    summary: 'Tambah Karyawan Baru (Create)',
    description: 'Menambahkan data master karyawan baru ke database beserta akun login sistem.',
  })
  @ApiResponse({ status: 201, description: 'Karyawan berhasil dibuat' })
  create(@Body() dto: CreateEmployeeDto) {
    return sendRpc(this.employeeClient, 'employees.create', dto);
  }

  @Patch('employees/:id')
  @Roles(UserRole.HRD)
  @ApiOperation({
    summary: 'Perbarui Data Karyawan (Update)',
    description: 'Memperbarui informasi jabatan, divisi, domisili WFH, nomor telepon, status keaktifan, maupun reset kata sandi.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() user: JwtUserPayload,
  ) {
    return sendRpc(this.employeeClient, 'employees.update', {
      id,
      dto,
      actorId: user.sub,
    });
  }

  @Delete('employees/:id')
  @Roles(UserRole.HRD)
  @ApiOperation({
    summary: 'Hapus Data Karyawan (Delete)',
    description: 'Menghapus data karyawan secara permanen dari basis data beserta catatan presensinya.',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUserPayload,
  ) {
    return sendRpc(this.employeeClient, 'employees.remove', {
      id,
      actorId: user.sub,
    });
  }
}

