import { TaskStatus } from "@prisma/client";
import { prisma, notDeleted } from "../db/prisma";

export async function getDashboard(tenantId: string) {
  const now = new Date();

  const [
    contactCount,
    organizationCount,
    openTasks,
    overdueTasks,
    recentContacts,
    recentInteractions,
    upcomingTasks,
  ] = await Promise.all([
    prisma.contact.count({ where: { tenantId, ...notDeleted } }),
    prisma.organization.count({ where: { tenantId, ...notDeleted } }),
    prisma.task.count({
      where: {
        tenantId,
        ...notDeleted,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
      },
    }),
    prisma.task.count({
      where: {
        tenantId,
        ...notDeleted,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        dueDate: { lt: now },
      },
    }),
    prisma.contact.findMany({
      where: { tenantId, ...notDeleted },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        organization: { select: { name: true } },
      },
    }),
    prisma.interaction.findMany({
      where: { tenantId, ...notDeleted },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        tenantId,
        ...notDeleted,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        dueDate: { gte: now },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        assignedUser: { select: { id: true, name: true } },
      },
    }),
  ]);

  const recentActivity = [
    ...recentContacts.map((c) => ({
      type: "contact_created" as const,
      date: c.createdAt,
      description: `${c.firstName} ${c.lastName}${c.organization ? ` — ${c.organization.name}` : ""} — New contact added`,
      contactId: c.id,
    })),
    ...recentInteractions.map((i) => ({
      type: "interaction_created" as const,
      date: i.createdAt,
      description: `${i.contact.firstName} ${i.contact.lastName} — ${formatInteractionType(i.type)} recorded`,
      contactId: i.contact.id,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8);

  return {
    stats: {
      contacts: contactCount,
      organizations: organizationCount,
      openTasks,
      overdueTasks,
    },
    upcomingTasks,
    recentActivity,
  };
}

function formatInteractionType(type: string): string {
  return type.charAt(0) + type.slice(1).toLowerCase().replace("_", " ");
}
