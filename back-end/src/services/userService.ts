import bcrypt from "bcryptjs";
import { prisma, notDeleted } from "../db/prisma";
import { AppError } from "../utils/errors";
import { AuthUser } from "../types/express.d";
import { signToken, toPublicUser } from "./authService";

export async function login(email: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { email, ...notDeleted },
    include: { tenant: true },
  });

  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
  };

  return {
    token: signToken(authUser),
    user: toPublicUser(authUser),
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, ...notDeleted },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.tenantId,
  };
}

export async function listTenantUsers(tenantId: string) {
  return prisma.user.findMany({
    where: { tenantId, ...notDeleted },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function createTenantUser(
  tenantId: string,
  data: { name: string; email: string; password: string; role?: "ADMIN" | "MEMBER" },
) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError(409, "EMAIL_EXISTS", "A user with this email already exists");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role ?? "MEMBER",
      tenantId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
}

export async function updateUserRole(
  tenantId: string,
  userId: string,
  role: "ADMIN" | "MEMBER",
  actingUserId: string,
) {
  if (userId === actingUserId) {
    throw new AppError(400, "CANNOT_CHANGE_OWN_ROLE", "You cannot change your own role");
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId, ...notDeleted },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}
