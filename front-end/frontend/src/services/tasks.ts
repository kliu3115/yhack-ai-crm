import { apiRequest, buildQuery } from './api';
import type { PaginatedResponse, Task, TaskPriority, TaskStatus } from '../types';

export function getTasks(params: {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedUserId?: string;
  contactId?: string;
  page?: number;
} = {}) {
  return apiRequest<PaginatedResponse<Task>>(`/tasks${buildQuery(params)}`);
}

export function getTask(id: string) {
  return apiRequest<Task>(`/tasks/${id}`);
}

export function createTask(data: Partial<Task>) {
  return apiRequest<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateTask(id: string, data: Partial<Task>) {
  return apiRequest<Task>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteTask(id: string) {
  return apiRequest<void>(`/tasks/${id}`, { method: 'DELETE' });
}
