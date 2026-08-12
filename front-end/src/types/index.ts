export type UserRole = 'ADMIN' | 'MEMBER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
}

export interface Organization {
  id: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  description?: string | null;
  contactCount?: number;
  contacts?: Contact[];
  recentInteractions?: Interaction[];
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  organizationId?: string | null;
  organization?: { id: string; name: string } | null;
  notes?: string | null;
  lastInteraction?: { date: string; type: string } | null;
  tasks?: Task[];
}

export type InteractionType =
  | 'EMAIL'
  | 'CALL'
  | 'MEETING'
  | 'EVENT'
  | 'IN_PERSON'
  | 'OTHER';

export interface Interaction {
  id: string;
  type: InteractionType;
  date: string;
  subject?: string | null;
  description?: string | null;
  user?: { id: string; name: string };
  contact?: { id: string; firstName: string; lastName: string };
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  contactId?: string | null;
  contact?: { id: string; firstName: string; lastName: string } | null;
  assignedUserId?: string | null;
  assignedUser?: { id: string; name: string } | null;
  createdByUser?: { id: string; name: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardData {
  stats: {
    contacts: number;
    organizations: number;
    openTasks: number;
    overdueTasks: number;
  };
  upcomingTasks: Task[];
  recentActivity: Array<{
    type: string;
    date: string;
    description: string;
    contactId?: string;
  }>;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
