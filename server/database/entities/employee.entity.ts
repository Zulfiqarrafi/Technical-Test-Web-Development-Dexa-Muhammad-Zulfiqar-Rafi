import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../../common/constants';
import { Department } from './department.entity';
import { Attendance } from './attendance.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30, unique: true })
  nik: string;

  @Column({ name: 'full_name', type: 'varchar', length: 120 })
  fullName: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 25, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 100 })
  position: string;

  @Index('IDX_employees_department')
  @Column({ name: 'department_id', type: 'int' })
  departmentId: number;

  @ManyToOne(() => Department, (dept) => dept.employees, {
    eager: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Index('IDX_employees_role')
  @Column({ type: 'varchar', length: 20, default: UserRole.EMPLOYEE })
  role: UserRole;

  @Column({ name: 'work_location', type: 'varchar', length: 200, nullable: true })
  workLocation: string | null;

  @Column({ name: 'join_date', type: 'varchar', length: 10 })
  joinDate: string;

  @Index('IDX_employees_active')
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Attendance, (att) => att.employee)
  attendances: Attendance[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

