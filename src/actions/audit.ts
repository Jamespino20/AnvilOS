/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 16, 2026
*/

"use server";

import { prisma } from "./_shared";
import { phMidnight, phEndOfDay } from "@/lib/format";

// ─────────── Audit Logs ───────────

export async function getAuditLogs(opts?: {
  startDate?: string;
  endDate?: string;
  search?: string;
  panel?: string;
}) {
  const where: any = {};
  if (opts?.startDate) where.logTime = { gte: phMidnight(opts.startDate) };
  if (opts?.endDate) {
    where.logTime = { ...where.logTime, lte: phEndOfDay(opts.endDate) };
  }
  if (opts?.panel) where.panel = opts.panel;
  if (opts?.search) {
    where.OR = [
      { action: { contains: opts.search } },
      { details: { contains: opts.search } },
      { panel: { contains: opts.search } },
    ];
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { logTime: "desc" },
    include: { seller: { select: { sellerName: true } } },
    take: 200,
  });
}

// ─────────── Paginated Audit Logs ───────────

export async function getAuditLogCount(opts?: {
  startDate?: string;
  endDate?: string;
  search?: string;
  panel?: string;
}) {
  const where: any = {};
  if (opts?.startDate) where.logTime = { gte: phMidnight(opts.startDate) };
  if (opts?.endDate)
    where.logTime = { ...where.logTime, lte: phEndOfDay(opts.endDate) };
  if (opts?.panel) where.panel = opts.panel;
  if (opts?.search)
    where.OR = [
      { action: { contains: opts.search } },
      { details: { contains: opts.search } },
      { panel: { contains: opts.search } },
    ];
  return prisma.auditLog.count({ where });
}

export async function getPaginatedAuditLogs(
  page: number,
  perPage: number,
  opts?: {
    startDate?: string;
    endDate?: string;
    search?: string;
    panel?: string;
    sellerId?: number;
  },
) {
  const where: any = {};
  if (opts?.startDate) where.logTime = { gte: phMidnight(opts.startDate) };
  if (opts?.endDate)
    where.logTime = {
      ...where.logTime,
      lte: phEndOfDay(opts.endDate),
    };
  if (opts?.panel) where.panel = opts.panel;
  if (opts?.sellerId) where.sellerId = opts.sellerId;
  if (opts?.search)
    where.OR = [
      { action: { contains: opts.search } },
      { details: { contains: opts.search } },
      { panel: { contains: opts.search } },
    ];
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { logTime: "desc" },
      include: { seller: { select: { sellerName: true, imageUrl: true } } },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { logs, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function getAuditLogUsers() {
  const result = await prisma.auditLog.findMany({
    where: { sellerId: { not: null } },
    distinct: ["sellerId"],
    select: { sellerId: true, seller: { select: { sellerName: true } } },
  });
  return result
    .filter((r) => r.seller)
    .map((r) => ({
      id: r.sellerId!,
      sellerName: r.seller!.sellerName,
    }));
}
