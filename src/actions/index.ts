/*
App Name: AnvilOS
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 21, 2026 
*/

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { withTimeout } from "@/lib/timeout";
import type { Prisma } from "@prisma/client";

const DB_TIMEOUT = 20000;

// ─────────── Products ───────────

export async function getProducts(opts?: {
  categoryId?: number;
  supplierId?: number;
  search?: string;
  status?: string;
}) {
  const where: any = {};
  if (opts?.categoryId) where.categoryId = opts.categoryId;
  if (opts?.supplierId) where.supplierId = opts.supplierId;
  if (opts?.search) {
    where.OR = [
      { productName: { contains: opts.search, mode: "insensitive" } },
    ];
  }
  if (opts?.status === "low")
    where.quantity = { lte: prisma.product.fields.minThreshold };
  if (opts?.status === "out") where.quantity = 0;
  if (opts?.status === "available") where.isAvailable = true;

  return withTimeout(
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { categoryRel: true, supplierRel: true },
    }),
    DB_TIMEOUT,
    "Loading products",
  );
}

export async function getProduct(id: number) {
  return prisma.product.findUnique({
    where: { id },
    include: { categoryRel: true, supplierRel: true },
  });
}

export async function createProduct(data: {
  productName: string;
  categoryId?: number;
  category: string;
  supplierId?: number;
  supplierName: string;
  unitPrice: number;
  quantity: number;
  minThreshold: number;
  imageUrl?: string;
}) {
  const fn = async () => {
    const product = await prisma.product.create({
      data: { ...data, isAvailable: true },
    });
    await logAudit(
      "ProductDialog",
      "Add Product",
      `${product.productName} created`,
    );
    return product;
  };
  try {
    return await fn();
  } catch (e: any) {
    if (e?.code === "P2002") {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('products', 'PRODUCT_ID'), COALESCE((SELECT MAX("PRODUCT_ID") FROM "products"), 1))`,
      );
      const product = await fn();
      revalidatePath("/inventory");
      return product;
    }
    throw e;
  }
}

export async function updateProduct(
  id: number,
  data: Partial<{
    productName: string;
    categoryId: number;
    category: string;
    supplierId: number;
    supplierName: string;
    unitPrice: number;
    quantity: number;
    minThreshold: number;
    isAvailable: boolean;
    imageUrl: string;
  }>,
) {
  const product = await prisma.product.update({ where: { id }, data });
  await logAudit(
    "InventoryPanel",
    "Edit Product",
    `${product.productName} (#${id}) updated`,
  );
  revalidatePath("/inventory");
  return product;
}

export async function adjustStock(productId: number, newQuantity: number) {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
  });
  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      quantity: newQuantity,
      isAvailable: newQuantity > 0 ? product.isAvailable : false,
    },
  });
  await logAudit(
    "InventoryPanel",
    "Adjust Stock",
    `${product.productName}: ${product.quantity} → ${newQuantity}`,
  );
  revalidatePath("/inventory");
  return updated;
}

export async function setProductAvailability(id: number, isAvailable: boolean) {
  const product = await prisma.product.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.product.update({
    where: { id },
    data: { isAvailable, ...(isAvailable ? {} : { quantity: 0 }) },
  });
  await logAudit(
    "InventoryPanel",
    isAvailable ? "Mark Available" : "Mark Unavailable",
    `${product.productName} (#${id})`,
  );
  revalidatePath("/inventory");
  return updated;
}

export async function deleteProduct(id: number) {
  const product = await prisma.product.findUniqueOrThrow({ where: { id } });
  await prisma.product.delete({ where: { id } });
  await logAudit(
    "InventoryPanel",
    "Delete Product",
    `${product.productName} (#${id}) deleted`,
  );
  revalidatePath("/inventory");
}

// ─────────── Categories ───────────

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { childCategories: true, _count: { select: { products: true } } },
  });
}

export async function createCategory(name: string, parentCategoryId?: number) {
  const cat = await prisma.category.create({
    data: { name, parentCategoryId },
  });
  await logAudit("InventoryPanel", "Add Category", `${cat.name} created`);
  revalidatePath("/inventory");
  return cat;
}

// ─────────── Suppliers ───────────

export async function getSuppliers() {
  return prisma.supplier.findMany({
    orderBy: { supplierName: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function getSupplier(id: number) {
  return prisma.supplier.findUnique({
    where: { id },
    include: { products: true },
  });
}

export async function createSupplier(data: {
  supplierName: string;
  contactName?: string;
  contactNumber?: string;
  email?: string;
  address?: string;
}) {
  const fn = async () => {
    const s = await prisma.supplier.create({
      data: { ...data, isAvailable: true },
    });
    await logAudit(
      "SupplierPanel",
      "Add Supplier",
      `${s.supplierName} created`,
    );
    return s;
  };
  try {
    return await fn();
  } catch (e: any) {
    if (e?.code === "P2002") {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('suppliers', 'SUPPLIER_ID'), COALESCE((SELECT MAX("SUPPLIER_ID") FROM "suppliers"), 1))`,
      );
      const s = await fn();
      revalidatePath("/suppliers");
      return s;
    }
    throw e;
  }
}

export async function updateSupplier(
  id: number,
  data: Partial<{
    supplierName: string;
    contactName: string;
    contactNumber: string;
    email: string;
    address: string;
    isAvailable: boolean;
  }>,
) {
  const before = await prisma.supplier.findUniqueOrThrow({ where: { id } });
  const s = await prisma.supplier.update({ where: { id }, data });
  await logAudit(
    "SupplierPanel",
    "Edit Supplier",
    `${before.supplierName} → ${s.supplierName}`,
  );
  revalidatePath("/suppliers");
  return s;
}

// ─────────── Transactions ───────────

export async function getTransactions(opts?: {
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}) {
  const where: any = {};
  if (opts?.status) where.transactionStatus = opts.status;
  if (opts?.type) where.transactionType = opts.type;
  if (opts?.startDate)
    where.transactionDate = { gte: new Date(opts.startDate) };
  if (opts?.endDate) {
    where.transactionDate = {
      ...where.transactionDate,
      lte: new Date(opts.endDate),
    };
  }
  if (opts?.search) {
    where.OR = [
      { buyerName: { contains: opts.search, mode: "insensitive" } },
      { receiptNumber: parseInt(opts.search) || undefined },
    ].filter(Boolean);
  }

  return withTimeout(
    prisma.transaction.findMany({
      where,
      orderBy: { transactionDate: "desc" },
      include: { items: true, seller: { select: { sellerName: true } } },
      take: 100,
    }),
    DB_TIMEOUT,
    "Loading transactions",
  );
}

export async function getTransaction(id: number) {
  return prisma.transaction.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      seller: { select: { sellerName: true } },
    },
  });
}

async function applyStockChanges(
  type:
    | "SaleWalkIn"
    | "SalePO"
    | "Restock"
    | "Adjustment"
    | "Return"
    | "Damage",
  items: { productId: number; quantity: number }[],
) {
  for (const item of items) {
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: item.productId },
    });
    let newQty = product.quantity;

    switch (type) {
      case "SaleWalkIn":
      case "Damage":
        newQty = product.quantity - item.quantity;
        if (newQty < 0)
          throw new Error(
            `Insufficient stock for "${product.productName}" (have ${product.quantity}, need ${item.quantity})`,
          );
        break;
      case "Return":
        newQty = product.quantity + item.quantity;
        break;
      case "Restock":
        // Stock increased only when processed via Restocks module
        break;
      case "Adjustment":
        newQty = item.quantity; // absolute override
        break;
      case "SalePO":
        // No stock change until completed via edit
        break;
    }

    await prisma.product.update({
      where: { id: item.productId },
      data: { quantity: newQty, isAvailable: newQty > 0 },
    });
  }
}

export async function createTransaction(data: {
  buyerName: string;
  buyerAddress?: string;
  buyerContact?: string;
  transactionType:
    | "SaleWalkIn"
    | "SalePO"
    | "Restock"
    | "Adjustment"
    | "Return"
    | "Damage";
  transactionStatus: "Ongoing" | "Completed" | "Cancelled";
  grandTotal: number;
  paymentMethod?: string;
  deliveryMethod?: "WalkIn" | "Pickup" | "Delivery" | "COD";
  items: {
    productId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  returnForReceiptNumber?: number;
}) {
  const session = await auth();
  const sellerId = Number(session?.user?.id) || 0;
  const sellerName = session?.user?.name || "Unknown";

  const lastReceipt = await prisma.transaction.findFirst({
    orderBy: { receiptNumber: "desc" },
    select: { receiptNumber: true },
  });
  const receiptNumber = (lastReceipt?.receiptNumber ?? 1000) + 1;

  // Return validation
  if (data.transactionType === "Return" && data.returnForReceiptNumber) {
    const orig = await prisma.transaction.findFirst({
      where: { receiptNumber: data.returnForReceiptNumber },
      include: { items: true },
    });
    if (!orig) throw new Error("Original receipt not found");
    if (orig.isReturned)
      throw new Error("This receipt has already been returned");
    if (
      orig.transactionType !== "SaleWalkIn" &&
      orig.transactionType !== "SalePO"
    )
      throw new Error("Can only return Sale transactions");

    // Validate per-product return quantities
    for (const item of data.items) {
      const origItem = orig.items.find((i) => i.productId === item.productId);
      if (!origItem)
        throw new Error(`Product #${item.productId} not in original receipt`);

      const alreadyReturned = await prisma.transactionItem.aggregate({
        where: {
          productId: item.productId,
          transaction: {
            returnForReceiptNumber: data.returnForReceiptNumber,
            transactionType: "Return",
          },
        },
        _sum: { quantity: true },
      });
      const returnedQty = alreadyReturned._sum.quantity ?? 0;
      const maxReturnable = (origItem.quantity ?? 0) - returnedQty;
      if (item.quantity > maxReturnable)
        throw new Error(
          `Can only return ${maxReturnable} of "${origItem.productName}"`,
        );
    }
  }

  // Apply stock changes
  if (data.transactionStatus === "Completed") {
    await applyStockChanges(data.transactionType, data.items);
  }

  const transaction = await withTimeout(
    prisma.transaction.create({
      data: {
        receiptNumber,
        buyerName: data.buyerName,
        buyerAddress: data.buyerAddress || "",
        buyerContact: data.buyerContact || "",
        sellerId: sellerId || undefined,
        sellerName,
        transactionType: data.transactionType,
        deliveryMethod: data.deliveryMethod || "WalkIn",
        paymentMethod: data.paymentMethod || undefined,
        transactionStatus: data.transactionStatus,
        transactionDate: new Date(),
        grandTotal: data.grandTotal,
        returnForReceiptNumber: data.returnForReceiptNumber,
        isReturned: data.transactionType === "Return",
        items: { create: data.items },
      },
    }),
    DB_TIMEOUT,
    "Processing transaction",
  );

  await logAudit(
    "POSPanel",
    "Complete Transaction",
    `${data.transactionType} #${receiptNumber} — ${data.buyerName} — ₱${data.grandTotal.toLocaleString()}`,
  );

  revalidatePath("/transactions");
  revalidatePath("/pos");
  revalidatePath("/inventory");
  return transaction;
}

export async function updateTransactionStatus(
  id: number,
  status: "Ongoing" | "Completed" | "Cancelled",
) {
  const txn = await prisma.transaction.findUniqueOrThrow({
    where: { id },
    include: { items: true },
  });

  // If completing a Sale PO, deduct stock now
  if (
    status === "Completed" &&
    txn.transactionStatus === "Ongoing" &&
    txn.transactionType === "SalePO"
  ) {
    await applyStockChanges(
      "SalePO",
      txn.items.map((i) => ({
        productId: i.productId!,
        quantity: i.quantity!,
      })),
    );
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: { transactionStatus: status },
  });
  await logAudit(
    "EditTransactionDialog",
    "Update Status",
    `#${txn.receiptNumber}: ${txn.transactionStatus} → ${status}`,
  );
  revalidatePath("/transactions");
  revalidatePath("/pos");
  return updated;
}

export async function updateTransaction(
  id: number,
  data: {
    buyerName?: string;
    buyerAddress?: string;
    buyerContact?: string;
    transactionStatus?: "Ongoing" | "Completed" | "Cancelled";
    items?: {
      id?: number;
      productId: number;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[];
  },
) {
  const txn = await prisma.transaction.findUniqueOrThrow({
    where: { id },
    include: { items: true },
  });
  const oldItems = [...txn.items];

  // Update header
  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      buyerName: data.buyerName,
      buyerAddress: data.buyerAddress,
      buyerContact: data.buyerContact,
      transactionStatus: data.transactionStatus,
    },
  });

  // If items changed, recalculate stock deltas
  if (data.items) {
    await prisma.transactionItem.deleteMany({ where: { transactionId: id } });
    await prisma.transactionItem.createMany({
      data: data.items.map((i) => ({ ...i, transactionId: id })),
    });

    // Recalculate stock based on delta between old and new items
    for (const newItem of data.items) {
      const oldItem = oldItems.find((o) => o.productId === newItem.productId);
      const oldQty = oldItem?.quantity ?? 0;
      const product = await prisma.product.findUniqueOrThrow({
        where: { id: newItem.productId },
      });
      let delta = 0;

      switch (txn.transactionType) {
        case "Restock":
        case "Return":
          delta = newItem.quantity - oldQty;
          break;
        case "Damage":
        case "SaleWalkIn":
          delta = oldQty - newItem.quantity;
          break;
        case "Adjustment":
          delta = newItem.quantity - product.quantity;
          break;
        case "SalePO":
          delta = 0;
          if (data.transactionStatus === "Completed") delta = -newItem.quantity;
          break;
      }

      const newStock = product.quantity + delta;
      if (newStock < 0)
        throw new Error(`Insufficient stock for #${newItem.productId}`);
      await prisma.product.update({
        where: { id: newItem.productId },
        data: { quantity: newStock, isAvailable: newStock > 0 },
      });

      await logAudit(
        "EditTransactionDialog",
        txn.transactionType,
        `${product.productName} (#${txn.receiptNumber}): ${oldQty}→${newItem.quantity} (delta:${delta})`,
      );
    }
  }

  await logAudit(
    "EditTransactionDialog",
    "Edit Transaction",
    `#${txn.receiptNumber} updated`,
  );
  revalidatePath("/transactions");
  return updated;
}

// ─────────── Stock KPIs ───────────

export async function getDailySales(date?: string) {
  const start = date ? new Date(date) : new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const result = await prisma.transaction.aggregate({
    where: {
      transactionDate: { gte: start, lt: end },
      transactionType: { in: ["SaleWalkIn", "SalePO"] },
      transactionStatus: "Completed",
    },
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
    data.push({
      date: d.toLocaleDateString("en-US", { weekday: "short" }),
      total: Number(total),
    });
  }
  return data;
}

// ─────────── Audit Logs ───────────

export async function getAuditLogs(opts?: {
  startDate?: string;
  endDate?: string;
  search?: string;
  panel?: string;
}) {
  const where: any = {};
  if (opts?.startDate) where.logTime = { gte: new Date(opts.startDate) };
  if (opts?.endDate) {
    where.logTime = { ...where.logTime, lte: new Date(opts.endDate) };
  }
  if (opts?.panel) where.panel = opts.panel;
  if (opts?.search) {
    where.OR = [
      { action: { contains: opts.search, mode: "insensitive" } },
      { details: { contains: opts.search, mode: "insensitive" } },
      { panel: { contains: opts.search, mode: "insensitive" } },
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
  return prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
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

// ─────────── Buyers ───────────

export async function getBuyers() {
  const buyers = await prisma.transaction.groupBy({
    by: ["buyerName"],
    _count: { id: true },
    _sum: { grandTotal: true },
    orderBy: { _sum: { grandTotal: "desc" } },
  });

  // Fetch latest transaction per buyer for address/contact
  const latest = await prisma.transaction.groupBy({
    by: ["buyerName"],
    _max: { transactionDate: true, buyerAddress: true, buyerContact: true },
  });

  const latestMap = new Map(
    latest.map((l) => [
      l.buyerName,
      {
        buyerAddress: l._max.buyerAddress,
        buyerContact: l._max.buyerContact,
        lastOrder: l._max.transactionDate,
      },
    ]),
  );

  return buyers.map((b) => ({
    buyerName: b.buyerName,
    totalOrders: b._count.id,
    totalSpent: Number(b._sum.grandTotal || 0),
    ...(latestMap.get(b.buyerName) || {}),
  }));
}

export async function getBuyerTransactions(buyerName: string) {
  return prisma.transaction.findMany({
    where: { buyerName },
    orderBy: { transactionDate: "desc" },
    include: { items: true, seller: { select: { sellerName: true } } },
  });
}

// ─────────── Dashboard KPIs ───────────

export async function getDashboardKpis() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [dailySales, lowStockCount, totalProducts, totalTransactions] =
    await Promise.all([
      prisma.transaction.aggregate({
        where: {
          transactionDate: { gte: today, lt: tomorrow },
          transactionStatus: "Completed",
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
    ]);

  return {
    dailySales: Number(dailySales._sum.grandTotal || 0),
    transactionCount: dailySales._count,
    lowStockCount,
    totalProducts,
    totalTransactions,
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

  const inStock = stockStatuses.filter((p) => p.quantity > p.minThreshold).length;
  const lowStock = stockStatuses.filter((p) => p.quantity <= p.minThreshold && p.quantity > 0).length;
  const outOfStock = stockStatuses.filter((p) => p.quantity === 0).length;

  return {
    transactionTypes: txnTypes.map((t) => ({ type: t.transactionType, count: t._count })),
    stockStatus: { inStock, lowStock, outOfStock },
  };
}

export async function updateProfile(data: { name: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const user = await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: { sellerName: data.name },
  });
  await logAudit("Settings", "Update Profile", `Name changed to ${data.name}`);
  revalidatePath("/settings");
  return user;
}

export async function updateSecurityQuestions(data: {
  question1: string;
  answer1: string;
  question2: string;
  answer2: string;
  question3: string;
  answer3: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const user = await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: {
      securityQuestion1: data.question1,
      securityAnswer1: data.answer1,
      securityQuestion2: data.question2,
      securityAnswer2: data.answer2,
      securityQuestion3: data.question3,
      securityAnswer3: data.answer3,
    },
  });
  await logAudit(
    "Settings",
    "Update Security Questions",
    "Security questions updated",
  );
  revalidatePath("/settings");
  return user;
}

export async function updatePassword(newPassword: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const user = await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: { passwordHash },
  });
  await logAudit("Settings", "Change Password", "Password changed");
  revalidatePath("/settings");
  return user;
}

export async function processRestock(transactionId: number) {
  const txn = await prisma.transaction.findUniqueOrThrow({
    where: { id: transactionId },
    include: { items: true },
  });
  if (txn.transactionType !== "Restock")
    throw new Error("Not a restock transaction");

  for (const item of txn.items) {
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: item.productId! },
    });
    await prisma.product.update({
      where: { id: item.productId! },
      data: {
        quantity: product.quantity + (item.quantity ?? 0),
        isAvailable: true,
      },
    });
  }
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { transactionStatus: "Completed" },
  });
  await logAudit(
    "Restocks",
    "Process Restock",
    `#${txn.receiptNumber} processed (${txn.items.length} items)`,
  );
  revalidatePath("/restocks");
  revalidatePath("/inventory");
  return txn;
}

export async function updateBuyerInfo(
  buyerName: string,
  data: { buyerAddress?: string; buyerContact?: string },
) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const txns = await prisma.transaction.updateMany({
    where: { buyerName },
    data: {
      ...(data.buyerAddress !== undefined && {
        buyerAddress: data.buyerAddress,
      }),
      ...(data.buyerContact !== undefined && {
        buyerContact: data.buyerContact,
      }),
    },
  });
  await logAudit(
    "Buyers",
    "Update Buyer Info",
    `${buyerName}: address/contact updated`,
  );
  revalidatePath("/buyers");
  return txns;
}
