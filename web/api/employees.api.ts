import { Department, Employee, PaginatedResponse, UserRole } from '../types';
import { apiRequest } from './client';

export interface EmployeeFilterParams {
  search?: string;
  departmentId?: number | string;
  role?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}

export interface UpsertEmployeeInput {
  nik: string;
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  position: string;
  departmentId: number;
  role: UserRole;
  workLocation?: string;
  joinDate: string;
  isActive?: boolean;
}

export const employeesApi = {
  getDepartments() {
    return apiRequest<Department[]>('/api/departments');
  },

  getAll(params: EmployeeFilterParams) {
    return apiRequest<PaginatedResponse<Employee>>('/api/employees', {
      params: params as any,
    });
  },

  getById(id: number) {
    return apiRequest<Employee>(`/api/employees/${id}`);
  },

  create(input: UpsertEmployeeInput) {
    return apiRequest<Employee>('/api/employees', {
      method: 'POST',
      body: input,
    });
  },

  update(id: number, input: Partial<UpsertEmployeeInput>) {
    return apiRequest<Employee>(`/api/employees/${id}`, {
      method: 'PATCH',
      body: input,
    });
  },

  remove(id: number) {
    return apiRequest<{ id: number; message: string }>(`/api/employees/${id}`, {
      method: 'DELETE',
    });
  },
};

