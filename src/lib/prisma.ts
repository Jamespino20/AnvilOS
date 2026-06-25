/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const raw = process.env.DATABASE_URL!;
  const url = new URL(raw);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    connectionLimit: Number(url.searchParams.get("connectionLimit") || 3),
    idleTimeout: Number(url.searchParams.get("idleTimeout") || 120000),
    acquireTimeout: Number(url.searchParams.get("acquireTimeout") || 10000),
    charset: "utf8mb4",
    collation: "utf8mb4_unicode_ci",
  });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return Reflect.get(getPrisma(), prop);
  },
});

const userCache = new Map<
  number,
  { imageUrl: string | null; role: string; totpEnabled: boolean; ts: number }
>();
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_MAX = 200;

export async function getCachedUser(userId: number) {
  const now = Date.now();
  const cached = userCache.get(userId);
  if (cached && now - cached.ts < CACHE_TTL) return cached;

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { imageUrl: true, role: true, totpEnabled: true },
  });
  const entry = {
    imageUrl: u?.imageUrl ?? null,
    role: u?.role ?? "STAFF",
    totpEnabled: u?.totpEnabled ?? false,
    ts: now,
  };

  if (userCache.size >= CACHE_MAX) {
    const oldest = userCache.keys().next().value;
    if (oldest !== undefined) userCache.delete(oldest);
  }
  userCache.set(userId, entry);
  return entry;
}

export function invalidateUserCache(userId: number) {
  userCache.delete(userId);
}
