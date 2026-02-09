import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
  var prismaPgPool: Pool | undefined;
}

const isSQLite = process.env.DATABASE_URL?.startsWith("file:");

function resolvePgAdapter() {
  if (isSQLite) return null;
  const existingPool = globalThis.prismaPgPool;
  const pool =
    existingPool ??
    new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("sslmode=require") ? true : undefined,
    });
  if (!existingPool) {
    globalThis.prismaPgPool = pool;
  }
  return new PrismaPg(pool);
}

const logLevels =
  process.env.NODE_ENV === "development" ? (["query", "warn", "error"] as const) : (["warn", "error"] as const);

const adapter = resolvePgAdapter();

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: logLevels,
    ...(adapter ? { adapter } : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
