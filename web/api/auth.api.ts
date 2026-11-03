import { Employee } from '../types';
import { apiRequest } from './client';

export interface LoginResponse {
  accessToken: string;
  user: Employee;
}

export const authApi = {
  login(identifier: string, password: string) {
    return apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { identifier, password },
    });
  },

  getMe() {
    return apiRequest<Employee>('/api/auth/me');
  },

  changePassword(currentPassword: string, newPassword: string) {
    return apiRequest<{ message: string }>('/api/auth/change-password', {
      method: 'PATCH',
      body: { currentPassword, newPassword },
    });
  },
};

