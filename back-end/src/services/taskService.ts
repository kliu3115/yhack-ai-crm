import { Prisma, TaskStatus } from "@prisma/client";
import { prisma, notDeleted } from "../db/prisma";
import { AppError } from "../utils/errors";

type TaskInput = {
  title: string;
  description?: string | null;
  status?: "TODO" | "IN_PROGRESS" | "COMPLETED";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: Date | null;
  contactId?: string | null;
  assignedUserId?: string | null;
};

async function verifyContact(tenantId: string, contactId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, tenantId, ...notDeleted },
  });
  if (!contact) {
    throw new AppError(400, "INVALID_CONTACT", "Contact not found");
  }
}

async function verifyAssignee(tenantId: string, userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId, ...notDeleted },
  });
  if (!user) {
    throw new AppError(400, "INVALID_USER", "Assigned user not found");
  }
}

export async function listTasks(
  tenantId: string,
  query: {
    status?: TaskStatus;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    assignedUserId?: string;
    contactId?: string;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    page?: number;
    limit?: number;
  },
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 25;
  const skip = (page - 1) * limit;

  const where: Prisma.TaskWhereInput = {
    tenantId,
    ...notDeleted,
  };

  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.assignedUserId) where.assignedUserId = query.assignedUserId;
  if (query.contactId) where.contactId = query.contactId;

  if (query.dueDateFrom || query.dueDateTo) {
    where.dueDate = {};
    if (query.dueDateFrom) where.dueDate.gte = query.dueDateFrom;
    if (query.dueDateTo) where.dueDate.lte = query.dueDateTo;
  }

  const [data, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        assignedUser: { select: { id: true, name: true } },
        createdByUser: { select: { id: true, name: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getTask(tenantId: string, id: string) {
  const task = await prisma.task.findFirst({
    where: { id, tenantId, ...notDeleted },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true } },
      assignedUser: { select: { id: true, name: true } },
      createdByUser: { select: { id: true, name: true } },
    },
  });

  if (!task) {
    throw new AppError(404, "TASK_NOT_FOUND", "Task not found");
  }

  return task;
}

export async function createTask(tenantId: string, createdByUserId: string, data: TaskInput) {
  if (data.contactId) await verifyContact(tenantId, data.contactId);
  if (data.assignedUserId) await verifyAssignee(tenantId, data.assignedUserId);

  return prisma.task.create({
    data: {
      ...data,
      tenantId,
      createdByUserId,
    },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true } },
      assignedUser: { select: { id: true, name: true } },
    },
  });
}

export async function updateTask(tenantId: string, id: string, data: Partial<TaskInput>) {
  const existing = await prisma.task.findFirst({
    where: { id, tenantId, ...notDeleted },
  });

  if (!existing) {
    throw new AppError(404, "TASK_NOT_FOUND", "Task not found");
  }

  if (data.contactId) await verifyContact(tenantId, data.contactId);
  if (data.assignedUserId) await verifyAssignee(tenantId, data.assignedUserId);

  return prisma.task.update({
    where: { id },
    data,
    include: {
      contact: { select: { id: true, firstName: true, lastName: true } },
      assignedUser: { select: { id: true, name: true } },
    },
  });
}

export async function deleteTask(tenantId: string, id: string, userRole: string) {
  if (userRole !== "ADMIN") {
    throw new AppError(403, "FORBIDDEN", "Only admins can delete tasks");
  }

  const existing = await prisma.task.findFirst({
    where: { id, tenantId, ...notDeleted },
  });

  if (!existing) {
    throw new AppError(404, "TASK_NOT_FOUND", "Task not found");
  }

  await prisma.task.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
