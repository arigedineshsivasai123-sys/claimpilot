import { apiClient } from './api';
import { User, ApiResponse } from '../types';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponseData {
  token: string;
  user: User;
}

export const authService = {
  async register(params: RegisterParams): Promise<AuthResponseData> {
    const res = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/register', params);
    if (res.data.data.token) {
      localStorage.setItem('claimpilot_token', res.data.data.token);
      localStorage.setItem('claimpilot_user', JSON.stringify(res.data.data.user));
    }
    return res.data.data;
  },

  async login(params: LoginParams): Promise<AuthResponseData> {
    const res = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', params);
    if (res.data.data.token) {
      localStorage.setItem('claimpilot_token', res.data.data.token);
      localStorage.setItem('claimpilot_user', JSON.stringify(res.data.data.user));
    }
    return res.data.data;
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },

  logout(): void {
    localStorage.removeItem('claimpilot_token');
    localStorage.removeItem('claimpilot_user');
  },

  getCurrentUser(): User | null {
    const saved = localStorage.getItem('claimpilot_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  },

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem('claimpilot_token'));
  },
};
