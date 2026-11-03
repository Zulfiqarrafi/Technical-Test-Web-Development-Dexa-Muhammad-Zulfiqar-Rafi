import {
  AttendanceRecord,
  MonitorSummaryResponse,
  PaginatedResponse,
  TodayOverviewResponse,
} from '../types';
import { apiRequest } from './client';

export interface MonitorFilterParams {
  startDate?: string;
  endDate?: string;
  departmentId?: number | string;
  status?: string;
  completion?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const attendanceApi = {
  getTodayOverview() {
    return apiRequest<TodayOverviewResponse>('/api/attendance/today');
  },

  clockIn(photo: File, note?: string) {
    const formData = new FormData();
    formData.append('photo', photo);
    if (note?.trim()) {
      formData.append('note', note.trim());
    }
    return apiRequest<AttendanceRecord>('/api/attendance/clock-in', {
      method: 'POST',
      body: formData,
    });
  },

  clockOut(photo?: File | null, note?: string) {
    const formData = new FormData();
    if (photo) {
      formData.append('photo', photo);
    }
    if (note !== undefined) {
      formData.append('note', note);
    }
    return apiRequest<AttendanceRecord>('/api/attendance/clock-out', {
      method: 'POST',
      body: formData,
    });
  },

  getMyHistory(params: { month?: string; page?: number; limit?: number }) {
    return apiRequest<PaginatedResponse<AttendanceRecord>>(
      '/api/attendance/my-history',
      { params },
    );
  },

  getMonitorSummary(date?: string) {
    return apiRequest<MonitorSummaryResponse>(
      '/api/attendance/monitoring/summary',
      { params: { date } },
    );
  },

  getMonitorList(params: MonitorFilterParams) {
    return apiRequest<PaginatedResponse<AttendanceRecord>>(
      '/api/attendance/monitoring',
      { params: params as any },
    );
  },
};

