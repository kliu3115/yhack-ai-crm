import { apiRequest } from './api';
import type { Interaction, InteractionType } from '../types';

export function getInteractions(contactId: string) {
  return apiRequest<Interaction[]>(`/contacts/${contactId}/interactions`);
}

export function createInteraction(
  contactId: string,
  data: {
    type: InteractionType;
    date: string;
    subject?: string;
    description?: string;
  },
) {
  return apiRequest<Interaction>(`/contacts/${contactId}/interactions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateInteraction(id: string, data: Partial<Interaction>) {
  return apiRequest<Interaction>(`/interactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteInteraction(id: string) {
  return apiRequest<void>(`/interactions/${id}`, { method: 'DELETE' });
}
