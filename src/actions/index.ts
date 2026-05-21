"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─────────── Products ───────────

export async function getProducts(opts?: { categoryId?: number; supplierId?: number; search?: string; status?: string }) {
  const where: any = {};
  if (opts?.categoryId) where.categoryId = opts.categoryId;
  if (opts?.supplierId) where.supplierId = opts.supplierId;
  if (opts?.search) {
    where.OR = [
      { productName: { contains: opts.search, mode: "insensitive" } },
    ];
  }
  if (opts?.status === "low") where.quantity = { lte: prisma.product.fields.minThreshold };
  if (opts?.status === "out") where.quantity = 0;
  if (opts?.status === "available") where.isAvailable = true;

  return prisma.product.findMany({ where, orderBy: { updatedAt: "desc" }, include: { categoryRel: true, supplierRel: true } });
}

export async function getProduct(id: number) {
  return prisma.product.findUnique({ where: { id }, include: { categoryRel: true, supplierRel: true } });
}

export async function createProduct(data: {
  productName: string; categoryId?: number; category: string; supplierId?: number; supplierName: string;
  unitPrice: number; quantity: number; minThreshold: number;
}) {
  try {
    const product = await prisma.product.create({ data: { ...data, isAvailable: true } });
    revalidatePath("/inventory");
    return product;
  } catch (e: any) {
    if (e?.code === "P2002") {
      await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('products', 'PRODUCT_ID'), COALESCE((SELECT MAX("PRODUCT_ID") FROM "products"), 1))`);
      const product = await prisma.product.create({ data: { ...data, isAvailable: true } });
      revalidatePath("/inventory");
      return product;
    }
    throw e;
  }
}

export async function updateProduct(id: number, data: Partial<{
  productName: string; categoryId: number; category: string; supplierId: number; supplierName: string;
  unitPrice: number; quantity: number; minThreshold: number; isAvailable: boolean;
}>) {
  const product = await prisma.product.update({ where: { id }, data });
  revalidatePath("/inventory");
  return product;
}

export async function deleteProduct(id: number) {
  await prisma.product.delete({ where: { id } });
  revalidatePath("/inventory");
}

// ─────────── Categories ───────────

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" }, include: { childCategories: true, _count: { select: { products: true } } } });
}

export async function createCategory(name: string, parentCategoryId?: number) {
  const category = await prisma.category.create({ data: { name, parentCategoryId } });
  revalidatePath("/inventory");
  return category;
}

// ─────────── Suppliers ───────────

export async function getSuppliers() {
  return prisma.supplier.findMany({ orderBy: { supplierName: "asc" }, include: { _count: { select: { products: true } } } });
}

export async function getSupplier(id: number) {
  return prisma.supplier.findUnique({ where: { id }, include: { products: true } });
}

export async function createSupplier(data: { supplierName: string; contactName?: string; contactNumber?: string; email?: string; address?: string }) {
  try {
    const supplier = await prisma.supplier.create({ data: { ...data, isAvailable: true } });
    revalidatePath("/suppliers");
    return supplier;
  } catch (e: any) {
    if (e?.code === "P2002") {
      await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('suppliers', 'SUPPLIER_ID'), COALESCE((SELECT MAX("SUPPLIER_ID") FROM "suppliers"), 1))`);
      const supplier = await prisma.supplier.create({ data: { ...data, isAvailable: true } });
      revalidatePath("/suppliers");
      return supplier;
    }
    throw e;
  }
}

export async function updateSupplier(id: number, data: Partial<{ supplierName: string; contactName: string; contactNumber: string; email: string; address: string; isAvailable: boolean }>) {
  const supplier = await prisma.supplier.update({ where: { id }, data });
  revalidatePath("/suppliers");
  return supplier;
}

// ─────────── Transactions ───────────

export async function getTransactions(opts?: { status?: string; type?: string; startDate?: string; endDate?: string; search?: string }) {
  const where: any = {};
  if (opts?.status) where.transactionStatus = opts.status;
  if (opts?.type) where.transactionType = opts.type;
  if (opts?.startDate) where.transactionDate = { gte: new Date(opts.startDate) };
  if (opts?.endDate) { where.transactionDate = { ...where.transactionDate, lte: new Date(opts.endDate) }; }
  if (opts?.search) {
    where.OR = [
      { buyerName: { contains: opts.search, mode: "insensitive" } },
      { receiptNumber: parseInt(opts.search) || undefined },
    ].filter(Boolean);
  }

  return prisma.transaction.findMany({
    where,
    orderBy: { transactionDate: "desc" },
    include: { items: true, seller: { select: { sellerName: true } } },
    take: 100,
  });
}

export async function createTransaction(data: {
  buyerName: string; buyerAddress?: string; buyerContact?: string;
  transactionType: "SaleWalkIn" | "SalePO" | "Restock" | "Adjustment" | "Return" | "Damage";
  transactionStatus: "Ongoing" | "Completed" | "Cancelled";
  grandTotal: number;
  items: { productId: number; quantity: number; unitPrice: number; totalPrice: number }[];
}) {
  const lastReceipt = await prisma.transaction.findFirst({ orderBy: { receiptNumber: "desc" }, select: { receiptNumber: true } });
  const receiptNumber = (lastReceipt?.receiptNumber ?? 1000) + 1;
  const transaction = await prisma.transaction.create({
    data: {
      receiptNumber,
      buyerName: data.buyerName,
      buyerAddress: data.buyerAddress || "",
      buyerContact: data.buyerContact || "",
      transactionType: data.transactionType,
      deliveryMethod: "WalkIn",
      transactionStatus: data.transactionStatus,
      transactionDate: new Date(),
      grandTotal: data.grandTotal,
      items: { create: data.items.map((item) => ({ ...item })) },
    },
  });
  revalidatePath("/transactions");
  revalidatePath("/pos");
  return transaction;
}

export async function getTransaction(id: number) {
  return prisma.transaction.findUnique({ where: { id }, include: { items: { include: { product: true } }, seller: { select: { sellerName: true } } } });
}

export async function getDailySales(date?: string) {
  const start = date ? new Date(date) : new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const result = await prisma.transaction.aggregate({
    where: { transactionDate: { gte: start, lt: end }, transactionType: { in: ["SaleWalkIn", "SalePO"] }, transactionStatus: "Completed" },
    _sum: { grandTotal: true },
    _count: true,
  });

  return { total: result._sum.grandTotal || 0, count: result._count };
}

export async function getRevenueTrend(days: number = 7) {
  const data: { date: string; total: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const { total } = await getDailySales(d.toISOString().split("T")[0]);
    data.push({ date: d.toLocaleDateString("en-US", { weekday: "short" }), total: Number(total) });
  }
  return data;
}

// ─────────── Audit Logs ───────────

export async function getAuditLogs(opts?: { startDate?: string; endDate?: string; search?: string; panel?: string }) {
  const where: any = {};
  if (opts?.startDate) where.logTime = { gte: new Date(opts.startDate) };
  if (opts?.endDate) { where.logTime = { ...where.logTime, lte: new Date(opts.endDate) }; }
  if (opts?.panel) where.panel = opts.panel;
  if (opts?.search) {
    where.OR = [
      { action: { contains: opts.search, mode: "insensitive" } },
      { details: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { logTime: "desc" },
    include: { seller: { select: { sellerName: true } } },
    take: 200,
  });
}

// ─────────── Notifications ───────────

export async function getNotifications() {
  return prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
}

export async function markNotificationRead(id: number) {
  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}

export async function markAllNotificationsRead() {
  await prisma.notification.updateMany({ data: { isRead: true } });
  revalidatePath("/notifications");
}

export async function getUnreadNotificationCount() {
  return prisma.notification.count({ where: { isRead: false } });
}

// ─────────── Dashboard KPIs ───────────

export async function getDashboardKpis() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [dailySales, lowStockCount, totalProducts, totalTransactions] = await Promise.all([
    prisma.transaction.aggregate({
      where: { transactionDate: { gte: today, lt: tomorrow }, transactionStatus: "Completed" },
      _sum: { grandTotal: true },
      _count: true,
    }),
    prisma.product.count({ where: { quantity: { lte: prisma.product.fields.minThreshold }, isAvailable: true } }),
    prisma.product.count({ where: { isAvailable: true } }),
    prisma.transaction.count(),
  ]);

  return {
    dailySales: Number(dailySales._sum.grandTotal || 0),
    transactionCount: dailySales._count,
    lowStockCount,
    totalProducts,
    totalTransactions,
  };
}
