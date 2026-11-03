export type UserRole = 'EMPLOYEE' | 'HRD';
export type AttendanceStatus = 'ON_TIME' | 'LATE';

export interface Department {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

export interface Employee {
  id: number;
  nik: string;
  fullName: string;
  email: string;
  phone: string | null;
  position: string;
  departmentId: number;
  department?: Department;
  role: UserRole;
  workLocation: string | null;
  joinDate: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  employee?: Employee | null;
  attendanceDate: string;
  clockInTime: string;
  clockInPhoto: string;
  clockInNote: string | null;
  clockInIp: string | null;
  clockOutTime: string | null;
  clockOutPhoto: string | null;
  clockOutNote: string | null;
  status: AttendanceStatus;
  workDurationMinutes: number | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface TodayOverviewResponse {
  serverTime: string;
  todayDate: string;
  workStartLimit: string;
  todayAttendance: AttendanceRecord | null;
  monthSummary: {
    month: string;
    totalPresent: number;
    onTime: number;
    late: number;
    completedOut: number;
  };
  recentLogs: AttendanceRecord[];
}

export interface DepartmentBreakdown {
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
}

export interface MonitorSummaryResponse {
  date: string;
  totalActiveEmployees: number;
  presentCount: number;
  onTimeCount: number;
  lateCount: number;
  clockedOutCount: number;
  notYetClockedInCount: number;
  departmentBreakdown?: DepartmentBreakdown[];
  missingEmployees: Array<{
    id: number;
    nik: string;
    fullName: string;
    position: string;
    phone: string | null;
    workLocation: string | null;
    department: { id: number; code: string; name: string } | null;
  }>;
}

