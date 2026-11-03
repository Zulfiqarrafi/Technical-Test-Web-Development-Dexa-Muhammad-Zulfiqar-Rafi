import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  EMPLOYEE_SERVICE,
  JwtUserPayload,
} from '../../common/constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { sendRpc } from '../../common/utils/rpc-helper';
import {
  ChangePasswordDto,
  LoginDto,
} from '../../services/employee-service/dto/employee.dto';

@ApiTags('Autentikasi & Akun')
@Controller('api/auth')
export class AuthController {
  constructor(
    @Inject(EMPLOYEE_SERVICE)
    private readonly employeeClient: ClientProxy,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login Karyawan / Admin HRD',
    description: 'Autentikasi menggunakan email korporat atau NIK beserta kata sandi. Mengembalikan JWT Bearer Token.',
  })
  @ApiResponse({ status: 200, description: 'Login berhasil, token JWT diterbitkan' })
  @ApiResponse({ status: 401, description: 'Kredensial tidak valid' })
  async login(@Body() dto: LoginDto) {
    const user = await sendRpc<any>(this.employeeClient, 'auth.validateLogin', dto);

    const payload: JwtUserPayload = {
      sub: user.id,
      nik: user.nik,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      departmentId: user.departmentId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Profil Pengguna Aktif',
    description: 'Mengambil profil data karyawan yang sedang login berdasarkan payload token JWT.',
  })
  async getProfile(@CurrentUser() currentUser: JwtUserPayload) {
    return sendRpc(this.employeeClient, 'employees.findOne', {
      id: currentUser.sub,
    });
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Ubah Kata Sandi Akun',
    description: 'Memperbarui kata sandi akun karyawan yang sedang login.',
  })
  async changePassword(
    @CurrentUser() currentUser: JwtUserPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return sendRpc(this.employeeClient, 'auth.changePassword', {
      employeeId: currentUser.sub,
      dto,
    });
  }
}

