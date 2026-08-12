import { apiRequest, setToken } from './api';
import type { DashboardData, User } from '../types';

export function login(email: string, password: string) {
  return apiRequest<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  setToken(null);
  return apiRequest<{ message: string }>('/auth/logout', { method: 'POST' });
}

export function getMe() {
  return apiRequest<User>('/auth/me');
}

export function getDashboard() {
  return apiRequest<DashboardData>('/dashboard');
}

export function getUsers() {
  return apiRequest<User[]>('/users');
}

export function createUser(data: {
  name: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'MEMBER';
}) {
  return apiRequest<User>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateUserRole(id: string, role: 'ADMIN' | 'MEMBER') {
  return apiRequest<User>(`/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}
