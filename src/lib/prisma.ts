/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/
/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

import "./diagnostics";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// In-memory user cache to avoid hitting DB on every session callback
// TTL: 5 minutes, max 200 entries
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
