import { Prisma } from "@prisma/client";
import { prisma, notDeleted } from "../db/prisma";
import { AppError } from "../utils/errors";

type OrganizationInput = {
  name: string;
  website?: string | null;
  industry?: string | null;
  description?: string | null;
};

export async function listOrganizations(
  tenantId: string,
  query: { search?: string; page?: number; limit?: number },
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 25;
  const skip = (page - 1) * limit;

  const where: Prisma.OrganizationWhereInput = {
    tenantId,
    ...notDeleted,
  };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { website: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      include: { _count: { select: { contacts: { where: notDeleted } } } },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.organization.count({ where }),
  ]);

  return {
    data: data.map(({ _count, ...org }) => ({
      ...org,
      contactCount: _count.contacts,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getOrganization(tenantId: string, id: string) {
  const org = await prisma.organization.findFirst({
    where: { id, tenantId, ...notDeleted },
    include: {
      contacts: {
        where: notDeleted,
        orderBy: { lastName: "asc" },
      },
    },
  });

  if (!org) {
    throw new AppError(404, "ORGANIZATION_NOT_FOUND", "Organization not found");
  }

  const contactIds = org.contacts.map((c) => c.id);
  const recentInteractions = contactIds.length
    ? await prisma.interaction.findMany({
        where: { tenantId, contactId: { in: contactIds }, ...notDeleted },
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
        take: 10,
      })
    : [];

  return { ...org, recentInteractions };
}

export async function createOrganization(tenantId: string, data: OrganizationInput) {
  return prisma.organization.create({
    data: { ...data, tenantId },
  });
}

export async function updateOrganization(
  tenantId: string,
  id: string,
  data: Partial<OrganizationInput>,
) {
  const existing = await prisma.organization.findFirst({
    where: { id, tenantId, ...notDeleted },
  });

  if (!existing) {
    throw new AppError(404, "ORGANIZATION_NOT_FOUND", "Organization not found");
  }

  return prisma.organization.update({ where: { id }, data });
}

export async function deleteOrganization(tenantId: string, id: string, userRole: string) {
  if (userRole !== "ADMIN") {
    throw new AppError(403, "FORBIDDEN", "Only admins can delete organizations");
  }

  const existing = await prisma.organization.findFirst({
    where: { id, tenantId, ...notDeleted },
  });

  if (!existing) {
    throw new AppError(404, "ORGANIZATION_NOT_FOUND", "Organization not found");
  }

  await prisma.organization.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
