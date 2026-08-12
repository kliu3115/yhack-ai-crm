import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const contactIdParamSchema = z.object({
  contactId: z.string().min(1),
});

export const createContactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateContactSchema = createContactSchema.partial();

export const contactQuerySchema = z.object({
  search: z.string().optional(),
  organizationId: z.string().optional(),
  sort: z.enum(["lastName", "firstName", "createdAt"]).optional().default("lastName"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const createOrganizationSchema = z.object({
  name: z.string().min(1),
  website: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

export const organizationQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const createInteractionSchema = z.object({
  type: z.enum(["EMAIL", "CALL", "MEETING", "EVENT", "IN_PERSON", "OTHER"]),
  date: z.coerce.date(),
  subject: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const updateInteractionSchema = createInteractionSchema.partial();

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.coerce.date().optional().nullable(),
  contactId: z.string().optional().nullable(),
  assignedUserId: z.string().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskQuerySchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  assignedUserId: z.string().optional(),
  contactId: z.string().optional(),
  dueDateFrom: z.coerce.date().optional(),
  dueDateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
});
