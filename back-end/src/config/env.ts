import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.API_PORT ?? 5000),
  authSecret: requireEnv("AUTH_SECRET", "dev-secret-change-me"),
  frontendUrl: requireEnv("FRONTEND_URL", "http://localhost:5173"),
  databaseUrl: requireEnv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/yhack_crm?schema=public",
  ),
};
