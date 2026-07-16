/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 16, 2026
*/

"use server";

import { prisma, auth } from "./_shared";

// ─────────── Financial Dashboard ───────────

export async function getFinancialDashboard(period?: {
  start: string;
  end: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const now = new Date();
  const start = period?.start
    ? new Date(period.start)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = period?.end
    ? new Date(period.end + "T23:59:59")
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const periodDays =
    Math.round((end.getTime() - start.getTime()) / 86400000) || 1;
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - periodDays);
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);

  async function periodStats(s: Date, e: Date) {
    const [
      sales,
      returns,
      restocksRaw,
      damages,
      adjustments,
      cancelled,
      paymentByMethod,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          transactionDate: { gte: s, lte: e },
          transactionStatus: "Completed",
          transactionType: { in: ["SaleWalkIn", "SalePO"] },
        },
        _sum: { grandTotal: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: {
          transactionDate: { gte: s, lte: e },
          transactionStatus: "Completed",
          transactionType: "Return",
        },
        _sum: { grandTotal: true },
        _count: true,
      }),
      prisma.transaction.findMany({
        where: {
          transactionDate: { gte: s, lte: e },
          transactionStatus: "Completed",
          transactionType: "Restock",
        },
        select: { id: true, grandTotal: true },
      }),
      prisma.transaction.aggregate({
        where: {
          transactionDate: { gte: s, lte: e },
          transactionStatus: "Completed",
          transactionType: "Damage",
        },
        _sum: { grandTotal: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: {
          transactionDate: { gte: s, lte: e },
          transactionStatus: "Completed",
          transactionType: "Adjustment",
        },
        _sum: { grandTotal: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: {
          transactionDate: { gte: s, lte: e },
          transactionStatus: "Cancelled",
        },
        _count: true,
      }),
      prisma.transaction.groupBy({
        by: ["paymentMethod"],
        where: {
          transactionDate: { gte: s, lte: e },
          transactionStatus: "Completed",
          transactionType: { in: ["SaleWalkIn", "SalePO"] },
        },
        _sum: { grandTotal: true },
        _count: true,
      }),
    ]);

    // Calculate restock cost from items if grandTotal is 0 (old data)
    let restocksTotal = restocksRaw.reduce(
      (sum, r) => sum + Number(r.grandTotal || 0),
      0,
    );
    const restocksCount = restocksRaw.length;
    if (restocksTotal === 0 && restocksCount > 0) {
      const itemIds = restocksRaw.map((r) => r.id);
      const items = await prisma.transactionItem.findMany({
        where: { transactionId: { in: itemIds } },
        select: { costPrice: true, unitPrice: true, quantity: true },
      });
      restocksTotal = items.reduce(
        (sum, i) =>
          sum + Number(i.costPrice || i.unitPrice || 0) * (i.quantity || 0),
        0,
      );
    }

    return {
      sales,
      returns,
      restocksTotal,
      restocksCount,
      damages,
      adjustments,
      cancelled,
      paymentByMethod,
    };
  }

  const [cur, prev] = await Promise.all([
    periodStats(start, end),
    periodStats(prevStart, prevEnd),
  ]);

  const gross = Number(cur.sales._sum.grandTotal || 0);
  const prevGross = Number(prev.sales._sum.grandTotal || 0);
  const returnsTotal = Number(cur.returns._sum.grandTotal || 0);
  const restocksTotal = cur.restocksTotal;
  const damagesTotal = Number(cur.damages._sum.grandTotal || 0);
  const adjustmentsTotal = Number(cur.adjustments._sum.grandTotal || 0);
  const grossRev = gross - returnsTotal;
  const netRev = grossRev - restocksTotal - damagesTotal;
  const prevNet = prevGross - Number(prev.returns._sum.grandTotal || 0);

  return {
    period: {
      start: start.toISOString(),
      end: end.toISOString(),
      label: `${start.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} – ${end.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}`,
    },
    grossSales: gross,
    returnsTotal,
    restocksTotal,
    damagesTotal,
    adjustmentsTotal,
    grossRevenue: grossRev,
    netRevenue: netRev,
    salesCount: cur.sales._count,
    returnCount: cur.returns._count,
    restockCount: cur.restocksCount,
    damageCount: cur.damages._count,
    adjustmentCount: cur.adjustments._count,
    cancelledCount: cur.cancelled._count,
    comparison: {
      grossChange: prevGross
        ? Number((((gross - prevGross) / prevGross) * 100).toFixed(1))
        : null,
      netChange: prevNet
        ? Number((((netRev - prevNet) / prevNet) * 100).toFixed(1))
        : null,
    },
    paymentBreakdown: cur.paymentByMethod.map((p) => ({
      method: p.paymentMethod || "Unknown",
      total: Number(p._sum.grandTotal || 0),
      count: p._count,
    })),
  };
}

export async function getCashFlowTrend(
  days: number = 30,
  startDate?: Date,
  endDate?: Date,
  hourly?: boolean,
  groupBy?: "hourly" | "daily" | "weekly" | "monthly",
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Convert UTC Date to Philippine time (UTC+8) components
  const PH_OFFSET = 8;
  const toPH = (d: Date) => {
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    const ph = new Date(utc + PH_OFFSET * 3600000);
    return {
      year: ph.getFullYear(),
      month: ph.getMonth(),
      date: ph.getDate(),
      day: ph.getDay(),
      hour: ph.getHours(),
    };
  };

  const start =
    startDate ||
    (() => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      d.setHours(0, 0, 0, 0);
      return d;
    })();
  const end =
    endDate ||
    (() => {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      return d;
    })();
  const effectiveDays =
    startDate && endDate
      ? Math.round((end.getTime() - start.getTime()) / 86400000) + 1
      : days;
  const [revenues, expenses] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        transactionDate: { gte: start, lte: end },
        transactionStatus: "Completed",
        transactionType: { in: ["SaleWalkIn", "SalePO"] },
      },
      select: { transactionDate: true, grandTotal: true },
    }),
    prisma.transaction.findMany({
      where: {
        transactionDate: { gte: start, lte: end },
        transactionStatus: "Completed",
        transactionType: { in: ["Restock", "Damage"] },
      },
      select: { transactionDate: true, grandTotal: true },
    }),
  ]);

  const effectiveGroupBy = groupBy || (hourly ? "hourly" : "daily");

  // ── Hourly grouping ──
  if (effectiveGroupBy === "hourly") {
    const PH_OFFSET = 8; // Philippines is UTC+8
    const toPHHour = (d: Date) => (d.getUTCHours() + PH_OFFSET) % 24;
    const revMap = new Map<number, number>();
    const expMap = new Map<number, number>();
    for (const r of revenues) {
      const h = toPHHour(r.transactionDate);
      revMap.set(h, (revMap.get(h) || 0) + Number(r.grandTotal || 0));
    }
    for (const e of expenses) {
      const h = toPHHour(e.transactionDate);
      expMap.set(h, (expMap.get(h) || 0) + Number(e.grandTotal || 0));
    }
    const data: {
      date: string;
      revenue: number;
      expenses: number;
      net: number;
    }[] = [];
    for (let h = 0; h < 24; h++) {
      const rev = revMap.get(h) || 0;
      const exp = expMap.get(h) || 0;
      data.push({
        date: `${String(h).padStart(2, "0")}:00`,
        revenue: rev,
        expenses: exp,
        net: rev - exp,
      });
    }
    return data;
  }

  // ── Monthly grouping ──
  if (effectiveGroupBy === "monthly") {
    const revMap = new Map<string, number>();
    const expMap = new Map<string, number>();
    for (const r of revenues) {
      const ph = toPH(r.transactionDate);
      const key = `${ph.year}-${String(ph.month + 1).padStart(2, "0")}`;
      revMap.set(key, (revMap.get(key) || 0) + Number(r.grandTotal || 0));
    }
    for (const e of expenses) {
      const ph = toPH(e.transactionDate);
      const key = `${ph.year}-${String(ph.month + 1).padStart(2, "0")}`;
      expMap.set(key, (expMap.get(key) || 0) + Number(e.grandTotal || 0));
    }
    // Iterate month by month from start to end
    const data: {
      date: string;
      revenue: number;
      expenses: number;
      net: number;
    }[] = [];
    const phStartMonth = toPH(start);
    const phEndMonth = toPH(end);
    const cur = new Date(phStartMonth.year, phStartMonth.month, 1);
    const endMonth = new Date(phEndMonth.year, phEndMonth.month, 1);
    const totalSpanMonths = Math.round(
      (end.getTime() - start.getTime()) / (30 * 86400000),
    );
    const useFullYear = totalSpanMonths > 24;
    while (cur <= endMonth) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
      const label = cur.toLocaleDateString("en-US", {
        month: "short",
        year: useFullYear ? "numeric" : "2-digit",
      });
      const rev = revMap.get(key) || 0;
      const exp = expMap.get(key) || 0;
      data.push({ date: label, revenue: rev, expenses: exp, net: rev - exp });
      cur.setMonth(cur.getMonth() + 1);
    }
    return data;
  }

  // ── Weekly grouping ──
  if (effectiveGroupBy === "weekly") {
    const revMap = new Map<string, number>();
    const expMap = new Map<string, number>();
    for (const r of revenues) {
      const ph = toPH(r.transactionDate);
      const dayOfWeek = ph.day;
      const dayOffset = (dayOfWeek + 6) % 7;
      const mondayDate = ph.date - dayOffset;
      const monday = new Date(ph.year, ph.month, mondayDate);
      const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
      revMap.set(key, (revMap.get(key) || 0) + Number(r.grandTotal || 0));
    }
    for (const e of expenses) {
      const ph = toPH(e.transactionDate);
      const dayOfWeek = ph.day;
      const dayOffset = (dayOfWeek + 6) % 7;
      const mondayDate = ph.date - dayOffset;
      const monday = new Date(ph.year, ph.month, mondayDate);
      const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
      expMap.set(key, (expMap.get(key) || 0) + Number(e.grandTotal || 0));
    }
    // Iterate weeks from start to end
    const data: {
      date: string;
      revenue: number;
      expenses: number;
      net: number;
    }[] = [];
    const phStart = toPH(start);
    const dayOfWeek = phStart.day;
    const cur = new Date(
      phStart.year,
      phStart.month,
      phStart.date - ((dayOfWeek + 6) % 7),
    );
    const totalSpanMonthsW = Math.round(
      (end.getTime() - start.getTime()) / (30 * 86400000),
    );
    const useFullYearW = totalSpanMonthsW > 24;
    while (cur <= end) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
      const label = cur.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        ...(useFullYearW ? { year: "numeric" } : {}),
      });
      const rev = revMap.get(key) || 0;
      const exp = expMap.get(key) || 0;
      data.push({ date: label, revenue: rev, expenses: exp, net: rev - exp });
      cur.setDate(cur.getDate() + 7);
    }
    return data;
  }

  // ── Daily grouping (default) ──
  const revMap = new Map<string, number>();
  for (const r of revenues) {
    const ph = toPH(r.transactionDate);
    const key = `${ph.year}-${String(ph.month + 1).padStart(2, "0")}-${String(ph.date).padStart(2, "0")}`;
    revMap.set(key, (revMap.get(key) || 0) + Number(r.grandTotal || 0));
  }
  const expMap = new Map<string, number>();
  for (const e of expenses) {
    const ph = toPH(e.transactionDate);
    const key = `${ph.year}-${String(ph.month + 1).padStart(2, "0")}-${String(ph.date).padStart(2, "0")}`;
    expMap.set(key, (expMap.get(key) || 0) + Number(e.grandTotal || 0));
  }
  const data: {
    date: string;
    revenue: number;
    expenses: number;
    net: number;
  }[] = [];
  const totalSpanMonthsD = Math.round(
    (end.getTime() - start.getTime()) / (30 * 86400000),
  );
  const useFullYearD = totalSpanMonthsD > 24;
  for (let i = effectiveDays - 1; i >= 0; i--) {
    const d = endDate
      ? new Date(end.getTime() - i * 86400000)
      : (() => {
          const d2 = new Date();
          d2.setDate(d2.getDate() - i);
          return d2;
        })();
    const ph = toPH(d);
    const key = `${ph.year}-${String(ph.month + 1).padStart(2, "0")}-${String(ph.date).padStart(2, "0")}`;
    const rev = revMap.get(key) || 0;
    const exp = expMap.get(key) || 0;
    const labelDate = new Date(ph.year, ph.month, ph.date);
    data.push({
      date: labelDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        ...(useFullYearD ? { year: "numeric" } : {}),
      }),
      revenue: rev,
      expenses: exp,
      net: rev - exp,
    });
  }
  return data;
}

export async function getTopProductsByRevenue(
  days: number = 30,
  limit: number = 10,
  startDate?: Date,
  endDate?: Date,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const start =
    startDate ||
    (() => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d;
    })();
  const items = await prisma.transactionItem.findMany({
    where: {
      transaction: {
        transactionDate: { gte: start, ...(endDate ? { lte: endDate } : {}) },
        transactionStatus: "Completed",
        transactionType: { in: ["SaleWalkIn", "SalePO"] },
      },
    },
    select: {
      productName: true,
      productId: true,
      quantity: true,
      totalPrice: true,
    },
  });

  // Build a lookup of product names for any null productNames
  const missingIds = [
    ...new Set(
      items
        .filter((i) => !i.productName)
        .map((i) => i.productId)
        .filter((id): id is number => id !== null),
    ),
  ];
  const productLookup = new Map<number, string>();
  if (missingIds.length > 0) {
    const prods = await prisma.product.findMany({
      where: { id: { in: missingIds } },
      select: { id: true, productName: true },
    });
    for (const p of prods) productLookup.set(p.id, p.productName);
  }

  const map = new Map<string, { qty: number; total: number }>();
  for (const item of items) {
    const name =
      item.productName ||
      (item.productId ? productLookup.get(item.productId) : null) ||
      "Deleted Product";
    const existing = map.get(name) || { qty: 0, total: 0 };
    existing.qty += item.quantity || 0;
    existing.total += Number(item.totalPrice || 0);
    map.set(name, existing);
  }
  return Array.from(map.entries())
    .map(([name, stats]) => ({
      name,
      quantity: stats.qty,
      revenue: stats.total,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}
