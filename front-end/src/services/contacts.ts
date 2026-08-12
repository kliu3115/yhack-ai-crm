import { apiRequest, buildQuery } from './api';
import type { Contact, PaginatedResponse } from '../types';

export function getContacts(params: {
  search?: string;
  organizationId?: string;
  sort?: string;
  page?: number;
  limit?: number;
} = {}) {
  return apiRequest<PaginatedResponse<Contact>>(`/contacts${buildQuery(params)}`);
}

export function getContact(id: string) {
  return apiRequest<Contact>(`/contacts/${id}`);
}

export function createContact(data: Partial<Contact>) {
  return apiRequest<Contact>('/contacts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateContact(id: string, data: Partial<Contact>) {
  return apiRequest<Contact>(`/contacts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteContact(id: string) {
  return apiRequest<void>(`/contacts/${id}`, { method: 'DELETE' });
}
