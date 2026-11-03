import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../common/constants';

export class LoginDto {
  @ApiProperty({
    example: 'budi.santoso@dexagroup.com',
    description: 'Email korporat atau Nomor Induk Karyawan (NIK)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Email atau NIK wajib diisi' })
  identifier: string;

  @ApiProperty({
    example: 'password123',
    description: 'Kata sandi akun',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi' })
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    example: 'password123',
    description: 'Password saat ini',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password saat ini wajib diisi' })
  currentPassword: string;

  @ApiProperty({
    example: 'newpassword123',
    description: 'Password baru minimal 6 karakter',
  })
  @IsString()
  @MinLength(6, { message: 'Password baru minimal 6 karakter' })
  newPassword: string;
}

export class CreateEmployeeDto {
  @ApiProperty({ example: 'DXG-26010', description: 'Nomor Induk Karyawan unik' })
  @IsString()
  @IsNotEmpty({ message: 'NIK wajib diisi' })
  @MaxLength(30)
  nik: string;

  @ApiProperty({ example: 'Budi Santoso', description: 'Nama lengkap karyawan' })
  @IsString()
  @IsNotEmpty({ message: 'Nama lengkap wajib diisi' })
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ example: 'budi.santoso@dexagroup.com', description: 'Email korporat unik' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @MaxLength(120)
  email: string;

  @ApiProperty({ example: 'password123', description: 'Password akun awal' })
  @IsString()
  @MinLength(6, { message: 'Password awal minimal 6 karakter' })
  password: string;

  @ApiPropertyOptional({ example: '081234567890', description: 'Nomor telepon / WhatsApp' })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  phone?: string;

  @ApiProperty({ example: 'Fullstack Software Engineer', description: 'Jabatan karyawan' })
  @IsString()
  @IsNotEmpty({ message: 'Jabatan wajib diisi' })
  @MaxLength(100)
  position: string;

  @ApiProperty({ example: 2, description: 'ID departemen terkait' })
  @Type(() => Number)
  @IsInt({ message: 'Departemen wajib dipilih' })
  departmentId: number;

  @ApiProperty({ enum: UserRole, example: UserRole.EMPLOYEE, description: 'Role hak akses sistem' })
  @IsEnum(UserRole, { message: 'Role harus EMPLOYEE atau HRD' })
  role: UserRole;

  @ApiPropertyOptional({ example: 'BSD City, Tangerang', description: 'Lokasi domisili pelaksanaan WFH' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  workLocation?: string;

  @ApiProperty({ example: '2026-11-01', description: 'Tanggal bergabung (YYYY-MM-DD)' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format tanggal bergabung harus YYYY-MM-DD' })
  joinDate: string;

  @ApiPropertyOptional({ example: true, default: true, description: 'Status keaktifan karyawan' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ example: 'DXG-26010' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  nik?: string;

  @ApiPropertyOptional({ example: 'Budi Santoso' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({ example: 'budi.santoso@dexagroup.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  @MaxLength(120)
  email?: string;

  @ApiPropertyOptional({ example: 'password123', description: 'Reset password bila diisi' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password?: string;

  @ApiPropertyOptional({ example: '081234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  phone?: string;

  @ApiPropertyOptional({ example: 'Senior Software Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.EMPLOYEE })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: 'BSD City, Tangerang' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  workLocation?: string;

  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format tanggal bergabung harus YYYY-MM-DD' })
  joinDate?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export interface EmployeeQueryPayload {
  search?: string;
  departmentId?: number;
  role?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}

