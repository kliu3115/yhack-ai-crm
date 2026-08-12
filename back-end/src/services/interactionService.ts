import { prisma, notDeleted } from "../db/prisma";
import { AppError } from "../utils/errors";
import { getContactForTenant } from "./contactService";

type InteractionInput = {
  type: "EMAIL" | "CALL" | "MEETING" | "EVENT" | "IN_PERSON" | "OTHER";
  date: Date;
  subject?: string | null;
  description?: string | null;
};

export async function listInteractions(tenantId: string, contactId: string) {
  await getContactForTenant(tenantId, contactId);

  return prisma.interaction.findMany({
    where: { tenantId, contactId, ...notDeleted },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });
}

export async function createInteraction(
  tenantId: string,
  contactId: string,
  userId: string,
  data: InteractionInput,
) {
  await getContactForTenant(tenantId, contactId);

  return prisma.interaction.create({
    data: { ...data, tenantId, contactId, userId },
    include: { user: { select: { id: true, name: true } } },
  });
}

export async function updateInteraction(
  tenantId: string,
  id: string,
  data: Partial<InteractionInput>,
) {
  const existing = await prisma.interaction.findFirst({
    where: { id, tenantId, ...notDeleted },
  });

  if (!existing) {
    throw new AppError(404, "INTERACTION_NOT_FOUND", "Interaction not found");
  }

  return prisma.interaction.update({
    where: { id },
    data,
    include: { user: { select: { id: true, name: true } } },
  });
}

export async function deleteInteraction(tenantId: string, id: string, userRole: string) {
  if (userRole !== "ADMIN") {
    throw new AppError(403, "FORBIDDEN", "Only admins can delete interactions");
  }

  const existing = await prisma.interaction.findFirst({
    where: { id, tenantId, ...notDeleted },
  });

  if (!existing) {
    throw new AppError(404, "INTERACTION_NOT_FOUND", "Interaction not found");
  }

  await prisma.interaction.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
