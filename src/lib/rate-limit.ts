import { prisma } from "@/lib/prisma";

export class RateLimitError extends Error {
  constructor() {
    super("Too many requests. Please try again later.");
    this.name = "RateLimitError";
  }
}

export async function checkRateLimit(
  identifier: string,
  maxAttempts: number,
  windowMinutes: number,
) {
  const now = new Date();
  const windowMs = windowMinutes * 60 * 1000;

  const record = await prisma.rateLimit.findUnique({
    where: { id: identifier },
  });

  if (!record || now > record.resetAt) {
    await prisma.rateLimit.upsert({
      where: { id: identifier },
      create: { id: identifier, attempts: 1, resetAt: new Date(now.getTime() + windowMs) },
      update: { attempts: 1, resetAt: new Date(now.getTime() + windowMs) },
    });
    return;
  }

  if (record.attempts >= maxAttempts) {
    throw new RateLimitError();
  }

  await prisma.rateLimit.update({
    where: { id: identifier },
    data: { attempts: { increment: 1 } },
  });
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
