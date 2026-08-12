import { apiRequest, buildQuery } from './api';
import type { Organization, PaginatedResponse } from '../types';

export function getOrganizations(params: { search?: string; page?: number; limit?: number } = {}) {
  return apiRequest<PaginatedResponse<Organization>>(`/organizations${buildQuery(params)}`);
}

export function getOrganization(id: string) {
  return apiRequest<Organization>(`/organizations/${id}`);
}

export function createOrganization(data: Partial<Organization>) {
  return apiRequest<Organization>('/organizations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateOrganization(id: string, data: Partial<Organization>) {
  return apiRequest<Organization>(`/organizations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteOrganization(id: string) {
  return apiRequest<void>(`/organizations/${id}`, { method: 'DELETE' });
}
