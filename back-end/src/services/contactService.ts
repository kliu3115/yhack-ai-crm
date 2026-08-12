import { Prisma } from "@prisma/client";
import { prisma, notDeleted } from "../db/prisma";
import { AppError } from "../utils/errors";

type ContactInput = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  organizationId?: string | null;
  notes?: string | null;
};

async function verifyOrganization(tenantId: string, organizationId: string) {
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, tenantId, ...notDeleted },
  });
  if (!org) {
    throw new AppError(400, "INVALID_ORGANIZATION", "Organization not found");
  }
}

export async function listContacts(
  tenantId: string,
  query: {
    search?: string;
    organizationId?: string;
    sort?: string;
    order?: "asc" | "desc";
    page?: number;
    limit?: number;
  },
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 25;
  const skip = (page - 1) * limit;

  const where: Prisma.ContactWhereInput = {
    tenantId,
    ...notDeleted,
  };

  if (query.organizationId) {
    where.organizationId = query.organizationId;
  }

  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: "insensitive" } },
      { lastName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      {
        organization: {
          name: { contains: query.search, mode: "insensitive" },
        },
      },
    ];
  }

  const orderBy: Prisma.ContactOrderByWithRelationInput = {};
  const sortField = query.sort ?? "lastName";
  orderBy[sortField as keyof Prisma.ContactOrderByWithRelationInput] = query.order ?? "asc";

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        organization: { select: { id: true, name: true } },
        interactions: {
          where: notDeleted,
          orderBy: { date: "desc" },
          take: 1,
          select: { date: true, type: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.contact.count({ where }),
  ]);

  return {
    data: contacts.map((c) => ({
      ...c,
      lastInteraction: c.interactions[0] ?? null,
      interactions: undefined,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getContact(tenantId: string, id: string) {
  const contact = await prisma.contact.findFirst({
    where: { id, tenantId, ...notDeleted },
    include: {
      organization: true,
      tasks: {
        where: notDeleted,
        orderBy: { dueDate: "asc" },
        include: {
          assignedUser: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!contact) {
    throw new AppError(404, "CONTACT_NOT_FOUND", "Contact not found");
  }

  return contact;
}

export async function createContact(tenantId: string, data: ContactInput) {
  if (data.organizationId) {
    await verifyOrganization(tenantId, data.organizationId);
  }

  return prisma.contact.create({
    data: { ...data, tenantId },
    include: { organization: { select: { id: true, name: true } } },
  });
}

export async function updateContact(tenantId: string, id: string, data: Partial<ContactInput>) {
  const existing = await prisma.contact.findFirst({
    where: { id, tenantId, ...notDeleted },
  });

  if (!existing) {
    throw new AppError(404, "CONTACT_NOT_FOUND", "Contact not found");
  }

  if (data.organizationId) {
    await verifyOrganization(tenantId, data.organizationId);
  }

  return prisma.contact.update({
    where: { id },
    data,
    include: { organization: { select: { id: true, name: true } } },
  });
}

export async function deleteContact(tenantId: string, id: string, userRole: string) {
  if (userRole !== "ADMIN") {
    throw new AppError(403, "FORBIDDEN", "Only admins can delete contacts");
  }

  const existing = await prisma.contact.findFirst({
    where: { id, tenantId, ...notDeleted },
  });

  if (!existing) {
    throw new AppError(404, "CONTACT_NOT_FOUND", "Contact not found");
  }

  await prisma.contact.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function getContactForTenant(tenantId: string, contactId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, tenantId, ...notDeleted },
  });

  if (!contact) {
    throw new AppError(404, "CONTACT_NOT_FOUND", "Contact not found");
  }

  return contact;
}
