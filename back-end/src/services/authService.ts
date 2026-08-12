import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthUser } from "../types/express.d";

const TOKEN_EXPIRY = "7d";

export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    },
    env.authSecret,
    { expiresIn: TOKEN_EXPIRY },
  );
}

export function verifyToken(token: string): AuthUser {
  const payload = jwt.verify(token, env.authSecret) as jwt.JwtPayload;
  return {
    id: payload.sub as string,
    email: payload.email as string,
    name: payload.name as string,
    role: payload.role as AuthUser["role"],
    tenantId: payload.tenantId as string,
  };
}

export function toPublicUser(user: AuthUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.tenantId,
  };
}
