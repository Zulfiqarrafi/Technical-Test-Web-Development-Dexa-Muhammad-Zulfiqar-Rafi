import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { AttendanceStatus } from '../../common/constants';
import { dateTimeColumnType } from '../column-types';
import { Employee } from './employee.entity';

@Entity('attendances')
@Unique('UQ_attendances_employee_date', ['employeeId', 'attendanceDate'])
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'employee_id', type: 'int' })
  employeeId: number;

  @ManyToOne(() => Employee, (emp) => emp.attendances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Index('IDX_attendances_date')
  @Column({ name: 'attendance_date', type: 'varchar', length: 10 })
  attendanceDate: string;

  @Column({ name: 'clock_in_time', type: dateTimeColumnType() })
  clockInTime: Date;

  @Column({ name: 'clock_in_photo', type: 'varchar', length: 255 })
  clockInPhoto: string;

  @Column({ name: 'clock_in_note', type: 'text', nullable: true })
  clockInNote: string | null;

  @Column({ name: 'clock_in_ip', type: 'varchar', length: 60, nullable: true })
  clockInIp: string | null;

  @Column({ name: 'clock_out_time', type: dateTimeColumnType(), nullable: true })
  clockOutTime: Date | null;

  @Column({ name: 'clock_out_photo', type: 'varchar', length: 255, nullable: true })
  clockOutPhoto: string | null;

  @Column({ name: 'clock_out_note', type: 'text', nullable: true })
  clockOutNote: string | null;

  @Index('IDX_attendances_status')
  @Column({ type: 'varchar', length: 20, default: AttendanceStatus.ON_TIME })
  status: AttendanceStatus;

  @Column({ name: 'work_duration_minutes', type: 'int', nullable: true })
  workDurationMinutes: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

