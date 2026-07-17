/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 16, 2026
*/

"use server";

import { prisma } from "./_shared";

export async function getDashboardKpis() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [dailySales, lowStockCount, totalProducts, totalTransactions, products] =
    await Promise.all([
      prisma.transaction.aggregate({
        where: {
          transactionDate: { gte: today, lt: tomorrow },
          transactionStatus: "Completed",
          transactionType: { in: ["SaleWalkIn", "SalePO"] },
        },
        _sum: { grandTotal: true },
        _count: true,
      }),
      prisma.product.count({
        where: {
          quantity: { lte: prisma.product.fields.minThreshold },
          isAvailable: true,
        },
      }),
      prisma.product.count({ where: { isAvailable: true } }),
      prisma.transaction.count(),
      prisma.product.findMany({
        select: { unitPrice: true, quantity: true },
      }),
    ]);

  const totalInventoryValue = products.reduce(
    (sum, p) => sum + Number(p.unitPrice || 0) * Number(p.quantity || 0),
    0,
  );

  return {
    dailySales: Number(dailySales._sum.grandTotal || 0),
    transactionCount: dailySales._count,
    lowStockCount,
    totalProducts,
    totalTransactions,
    totalInventoryValue,
  };
}

export async function getDashboardCharts() {
  const [txnTypes, stockStatuses] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["transactionType"],
      _count: true,
    }),
    prisma.product.findMany({
      where: { isAvailable: true },
      select: { quantity: true, minThreshold: true },
    }),
  ]);

  const inStock = stockStatuses.filter(
    (p) => p.quantity > p.minThreshold,
  ).length;
  const lowStock = stockStatuses.filter(
    (p) => p.quantity <= p.minThreshold && p.quantity > 0,
  ).length;
  const outOfStock = stockStatuses.filter((p) => p.quantity === 0).length;

  return {
    transactionTypes: txnTypes.map((t) => ({
      type: t.transactionType,
      count: t._count,
    })),
    stockStatus: { inStock, lowStock, outOfStock },
  };
}
