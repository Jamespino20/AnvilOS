/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 26, 2026
*/

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { withTimeout } from "@/lib/timeout";
import { IMPORT_CONFIGS } from "@/lib/import-configs";
import { actionFingerprint } from "@/lib/access";
import { requireAdmin, requireUser } from "@/lib/server-access";
import { formatMoney } from "@/lib/format";
import { createTotpSecret, verifyTotp } from "@/lib/totp";
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
  await requireAdmin();
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
      await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('products', 'PRODUCT_ID'), COALESCE((SELECT MAX("PRODUCT_ID") FROM "products"), 1))`;
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
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
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

export async function createCategory(name: string) {
  await requireAdmin();
  try {
    const cat = await prisma.category.create({
      data: { name },
    });
    await logAudit("InventoryPanel", "Add Category", `${cat.name} created`);
    revalidatePath("/inventory");
    revalidatePath("/categories");
    return cat;
  } catch (e: any) {
    if (e?.code === "P2002") {
      throw new Error(`A category named "${name}" already exists.`);
    }
    throw e;
  }
}

export async function editCategory(id: number, name: string) {
  await requireAdmin();
  try {
    const cat = await prisma.category.update({
      where: { id },
      data: { name },
    });
    await logAudit(
      "InventoryPanel",
      "Edit Category",
      `Category #${id} renamed to "${name}"`,
    );
    revalidatePath("/inventory");
    revalidatePath("/categories");
    return cat;
  } catch (e: any) {
    if (e?.code === "P2002") {
      throw new Error(`A category named "${name}" already exists.`);
    }
    throw e;
  }
}

export async function deleteCategory(id: number) {
  await requireAdmin();
  const linked = await prisma.product.count({ where: { categoryId: id } });
  if (linked > 0) {
    throw new Error(
      `Cannot delete category: ${linked} product(s) are linked to it. Remove or reassign them first.`,
    );
  }
  const cat = await prisma.category.findUniqueOrThrow({ where: { id } });
  await prisma.category.delete({ where: { id } });
  await logAudit(
    "InventoryPanel",
    "Delete Category",
    `${cat.name} (#${id}) deleted`,
  );
  revalidatePath("/inventory");
  revalidatePath("/categories");
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
  await requireAdmin();
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
      await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('suppliers', 'SUPPLIER_ID'), COALESCE((SELECT MAX("SUPPLIER_ID") FROM "suppliers"), 1))`;
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
  await requireAdmin();
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

export async function deleteSupplier(id: number) {
  await requireAdmin();
  const supplier = await prisma.supplier.findUniqueOrThrow({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (supplier._count.products > 0) {
    throw new Error("Cannot delete supplier with associated products");
  }
  await prisma.supplier.delete({ where: { id } });
  await logAudit(
    "SupplierPanel",
    "Delete Supplier",
    `${supplier.supplierName} deleted`,
  );
  revalidatePath("/suppliers");
}

// ─────────── Transactions ───────────

export async function getTransactions(opts?: {
  status?: string;
  statusIn?: string[];
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  perPage?: number;
}) {
  const where: any = {};
  if (opts?.status) where.transactionStatus = opts.status;
  if (opts?.statusIn) where.transactionStatus = { in: opts.statusIn };
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

  const take = opts?.perPage || 100;
  const skip = ((opts?.page || 1) - 1) * take;

  return withTimeout(
    prisma.transaction.findMany({
      where,
      orderBy: { transactionDate: "desc" },
      include: { items: true, seller: { select: { sellerName: true } } },
      skip,
      take,
    }),
    DB_TIMEOUT,
    "Loading transactions",
  );
}

export async function getTransactionsCount(opts?: {
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
  return prisma.transaction.count({ where });
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
  buyerEmail?: string;
  transactionType:
    | "SaleWalkIn"
    | "SalePO"
    | "Restock"
    | "Adjustment"
    | "Return"
    | "Damage";
  transactionStatus:
    | "Ongoing"
    | "Processing"
    | "OnTheWay"
    | "Completed"
    | "Cancelled";
  grandTotal: number;
  paymentMethod?: string;
  deliveryMethod?: "WalkIn" | "Pickup" | "Delivery" | "COD";
  items: {
    productId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    costPrice?: number;
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

  // Look up product names for transaction items
  const productIds = [...new Set(data.items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, productName: true },
  });
  const productNameMap = new Map(products.map((p) => [p.id, p.productName]));

  const itemsWithNames = data.items.map((i) => ({
    productId: i.productId,
    productName: productNameMap.get(i.productId) || `Product #${i.productId}`,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    totalPrice: i.totalPrice,
    costPrice: i.costPrice,
  }));

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
        items: { create: itemsWithNames },
      },
    }),
    DB_TIMEOUT,
    "Processing transaction",
  );

  // Upsert buyer record (skip for Restock — "CWL Hardware" is internal)
  let buyer: { id: number; email: string | null } | null = null;
  if (data.buyerName && data.transactionType !== "Restock") {
    buyer = await prisma.buyer.findFirst({
      where: { name: data.buyerName },
    });
    if (buyer) {
      buyer = await prisma.buyer.update({
        where: { id: buyer.id },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: data.grandTotal },
          address: data.buyerAddress || undefined,
          phone: data.buyerContact || undefined,
          email: data.buyerEmail || undefined,
          sellerId: sellerId || undefined,
        },
      });
    } else {
      buyer = await prisma.buyer.create({
        data: {
          name: data.buyerName,
          address: data.buyerAddress || null,
          phone: data.buyerContact || null,
          email: data.buyerEmail || null,
          totalOrders: 1,
          totalSpent: data.grandTotal,
          sellerId: sellerId || undefined,
        },
      });
    }
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { buyerId: buyer.id },
    });
  }
  // For Restock, still link the transaction if a "CWL Hardware" buyer already exists
  if (data.transactionType === "Restock" && data.buyerName) {
    const existing = await prisma.buyer.findFirst({
      where: { name: data.buyerName },
    });
    if (existing) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { buyerId: existing.id },
      });
    }
  }

  await logAudit(
    "POSPanel",
    "Complete Transaction",
    `${data.transactionType} #${receiptNumber} - ${data.buyerName} - ${formatMoney(data.grandTotal)}`,
  );

  // Fire-and-forget email alerts (non-blocking)
  if (data.transactionStatus === "Completed") {
    const actor = actionFingerprint(session);
    import("@/actions/email")
      .then((m) => {
        // 1. Check stock alerts
        m.checkAndAlertLowStock().catch((e) =>
          console.error("Low stock alert failed:", e),
        );

        // 2. Alert staff (systemwide)
        m.sendSystemTransactionAlert(
          receiptNumber,
          data.buyerName,
          data.grandTotal,
          actor,
        ).catch((e) => console.error("System transaction alert failed:", e));

        // 3. Email buyer (receipt)
        if (buyer?.email) {
          m.sendTransactionReceipt(
            receiptNumber,
            data.buyerName,
            buyer.email,
            itemsWithNames.map((i) => ({
              productName: i.productName,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.totalPrice,
            })),
            data.grandTotal,
            actor,
          ).catch((e) => console.error("Buyer receipt email failed:", e));
        }
      })
      .catch((e) => console.error("Failed to load email actions:", e));
  }

  revalidatePath("/transactions");
  revalidatePath("/pos");
  revalidatePath("/inventory");
  return transaction;
}

export async function getDeliverers() {
  const result = await prisma.transaction.findMany({
    where: { delivererName: { not: null } },
    select: { delivererName: true },
    distinct: ["delivererName"],
    orderBy: { delivererName: "asc" },
  });
  return result.map((r) => r.delivererName!);
}

export async function getReturnTransaction(receiptNumber: number) {
  const txn = await prisma.transaction.findFirst({
    where: { receiptNumber },
    include: { items: true },
  });
  if (!txn) throw new Error("Receipt not found");
  if (txn.transactionType !== "SaleWalkIn" && txn.transactionType !== "SalePO")
    throw new Error("Can only return Sale transactions");
  return {
    buyerName: txn.buyerName,
    items: txn.items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
  };
}

export async function updateTransactionStatus(
  id: number,
  status: "Ongoing" | "Processing" | "OnTheWay" | "Completed" | "Cancelled",
  deliveryData?: {
    deliveryRef?: string;
    deliveryNotes?: string;
    delivererName?: string;
  },
) {
  await requireAdmin();
  const txn = await prisma.transaction.findUniqueOrThrow({
    where: { id },
    include: { items: true },
  });

  // If completing a Sale PO, deduct stock now
  if (
    status === "Completed" &&
    txn.transactionStatus !== "Completed" &&
    txn.transactionType === "SalePO"
  ) {
    await applyStockChanges(
      "SaleWalkIn",
      txn.items.map((i) => ({
        productId: i.productId!,
        quantity: i.quantity!,
      })),
    );
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      transactionStatus: status,
      ...(deliveryData?.deliveryRef !== undefined && {
        deliveryRef: deliveryData.deliveryRef,
      }),
      ...(deliveryData?.deliveryNotes !== undefined && {
        deliveryNotes: deliveryData.deliveryNotes,
      }),
      ...(deliveryData?.delivererName !== undefined && {
        delivererName: deliveryData.delivererName,
      }),
    },
  });
  await logAudit(
    "EditTransactionDialog",
    "Update Status",
    `#${txn.receiptNumber}: ${txn.transactionStatus} → ${status}`,
  );
  revalidatePath("/transactions");
  revalidatePath("/pos");

  // Trigger alerts if now completed
  if (status === "Completed") {
    import("@/actions/email")
      .then((m) => m.checkAndAlertLowStock())
      .catch((e) => console.error("Low stock alert failed:", e));
  }

  return updated;
}

export async function updateTransaction(
  id: number,
  data: {
    buyerName?: string;
    buyerAddress?: string;
    buyerContact?: string;
    deliveryRef?: string;
    deliveryNotes?: string;
    delivererName?: string;
    transactionStatus?:
      | "Ongoing"
      | "Processing"
      | "OnTheWay"
      | "Completed"
      | "Cancelled";
    items?: {
      id?: number;
      productId: number;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[];
  },
) {
  await requireAdmin();
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
      deliveryRef: data.deliveryRef,
      deliveryNotes: data.deliveryNotes,
      delivererName: data.delivererName,
      transactionStatus: data.transactionStatus,
    },
  });

  // If items changed, recalculate stock deltas
  if (data.items) {
    const prodIds = [...new Set(data.items.map((i) => i.productId))];
    const prods = await prisma.product.findMany({
      where: { id: { in: prodIds } },
      select: { id: true, productName: true },
    });
    const nameMap = new Map(prods.map((p) => [p.id, p.productName]));
    const itemsWithNames = data.items.map((i) => ({
      productId: i.productId,
      productName: nameMap.get(i.productId) || `Product #${i.productId}`,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
      transactionId: id,
    }));

    await prisma.transactionItem.deleteMany({ where: { transactionId: id } });
    await prisma.transactionItem.createMany({ data: itemsWithNames });

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

export async function getNotifications(userId: number) {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const readIds = await prisma.notificationRead.findMany({
    where: { userId, notificationId: { in: notifications.map((n) => n.id) } },
    select: { notificationId: true },
  });
  const readSet = new Set(
    readIds.map((r: { notificationId: any }) => r.notificationId),
  );
  return notifications.map((n) => ({ ...n, isRead: readSet.has(n.id) }));
}

export async function markNotificationRead(userId: number, id: number) {
  await prisma.notificationRead.upsert({
    where: { notificationId_userId: { notificationId: id, userId } },
    create: { notificationId: id, userId },
    update: {},
  });
  await logAudit(
    "System",
    "Mark Notification Read",
    `Notification ${id} marked as read by user ${userId}`,
  );
}

export async function markAllNotificationsRead(userId: number) {
  const allNotifs = await prisma.notification.findMany({
    select: { id: true },
  });
  const existing = await prisma.notificationRead.findMany({
    where: { userId },
    select: { notificationId: true },
  });
  const existingIds = new Set(
    existing.map((r: { notificationId: any }) => r.notificationId),
  );
  const toCreate = allNotifs
    .filter((n) => !existingIds.has(n.id))
    .map((n) => ({ notificationId: n.id, userId }));
  if (toCreate.length > 0) {
    await prisma.notificationRead.createMany({ data: toCreate });
  }
  await logAudit(
    "System",
    "Mark All Read",
    `All notifications marked as read by user ${userId}`,
  );
  revalidatePath("/notifications");
}

export async function getUnreadNotificationCount(userId: number) {
  const total = await prisma.notification.count();
  const read = await prisma.notificationRead.count({ where: { userId } });
  return total - read;
}

// ─────────── Buyers ───────────

export async function getBuyers(type?: "WalkIn" | "PO") {
  const nameFilter =
    type === "WalkIn"
      ? await prisma.transaction
          .groupBy({
            by: ["buyerName"],
            where: { transactionType: "SaleWalkIn" },
          })
          .then((r) => r.map((x) => x.buyerName))
      : type === "PO"
        ? await prisma.transaction
            .groupBy({
              by: ["buyerName"],
              where: { transactionType: "SalePO" },
            })
            .then((r) => r.map((x) => x.buyerName))
        : null;

  const buyerRecords = nameFilter
    ? await prisma.buyer.findMany({
        where: { name: { in: nameFilter } },
        orderBy: { totalSpent: "desc" },
      })
    : await prisma.buyer.findMany({
        orderBy: { totalSpent: "desc" },
      });

  const latest = await prisma.transaction.groupBy({
    by: ["buyerName"],
    _max: { transactionDate: true },
  });
  const latestMap = new Map(
    latest.map((l) => [l.buyerName, l._max.transactionDate]),
  );

  const merged = buyerRecords.map((b) => ({
    buyerName: b.name,
    totalOrders: b.totalOrders,
    totalSpent: Number(b.totalSpent),
    buyerAddress: b.address,
    buyerContact: b.phone,
    buyerEmail: b.email,
    lastOrder: latestMap.get(b.name) || null,
  }));

  // Include legacy buyers from transactions not yet in Buyer table
  const existingNames = new Set(buyerRecords.map((b) => b.name));
  const legacyWhere: any = { buyerName: { notIn: Array.from(existingNames) } };
  if (nameFilter)
    legacyWhere.buyerName = {
      in: nameFilter,
      notIn: Array.from(existingNames),
    };
  if (existingNames.size > 0 && !(nameFilter && nameFilter.length === 0)) {
    const legacyBuyers = await prisma.transaction.groupBy({
      by: ["buyerName"],
      _count: { id: true },
      _sum: { grandTotal: true },
      where: legacyWhere,
    });
    const legacyLatest = await prisma.transaction.groupBy({
      by: ["buyerName"],
      _max: { transactionDate: true, buyerAddress: true, buyerContact: true },
      where: legacyWhere,
    });
    const legacyLatestMap = new Map(
      legacyLatest.map((l) => [
        l.buyerName,
        {
          buyerAddress: l._max.buyerAddress,
          buyerContact: l._max.buyerContact,
          lastOrder: l._max.transactionDate,
        },
      ]),
    );
    for (const b of legacyBuyers) {
      const info = legacyLatestMap.get(b.buyerName) || {
        buyerAddress: null,
        buyerContact: null,
        lastOrder: null,
      };
      merged.push({
        buyerName: b.buyerName,
        totalOrders: b._count.id,
        totalSpent: Number(b._sum.grandTotal || 0),
        buyerAddress: info.buyerAddress,
        buyerContact: info.buyerContact,
        buyerEmail: null,
        lastOrder: info.lastOrder || null,
      });
    }
  }

  merged.sort((a, b) => b.totalSpent - a.totalSpent);
  return merged.filter((b) => b.buyerName !== "CWL Hardware");
}

export async function getBuyerTransactions(buyerName: string) {
  return prisma.transaction.findMany({
    where: { buyerName },
    orderBy: { transactionDate: "desc" },
    include: {
      items: true,
      seller: { select: { sellerName: true } },
      buyer: true,
    },
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

export async function updateProfile(data: { name: string; imageUrl?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const updateData: any = { sellerName: data.name };
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  const user = await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: updateData,
  });
  await logAudit("Settings", "Update Profile", `Name changed to ${data.name}`);
  revalidatePath("/settings");
  return user;
}

export async function updatePassword(newPassword: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const bcrypt = await import("bcryptjs");
  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { id: Number(session.user.id) },
  });
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const user = await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: {
      oldPasswordHash: currentUser.passwordHash,
      passwordHash,
    },
  });
  await logAudit("Settings", "Change Password", "Password changed");
  revalidatePath("/settings");
  return user;
}

export async function startTotpSetup() {
  const session = await requireUser();
  const userId = Number((session.user as any).id);
  const secret = createTotpSecret();
  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: secret, totpEnabled: false },
  });
  await logAudit("Settings", "Start TOTP Setup", "Authenticator setup started");
  return { secret };
}

export async function confirmTotpSetup(code: string) {
  const session = await requireUser();
  const userId = Number((session.user as any).id);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { totpSecret: true },
  });
  if (!user.totpSecret || !verifyTotp(user.totpSecret, code)) {
    throw new Error("Invalid authenticator code");
  }
  await prisma.user.update({
    where: { id: userId },
    data: { totpEnabled: true },
  });
  await logAudit("Settings", "Enable TOTP", "Authenticator app enabled");
  return { success: true };
}

export async function disableTotp() {
  const session = await requireUser();
  const userId = Number((session.user as any).id);
  await prisma.user.update({
    where: { id: userId },
    data: { totpEnabled: false, totpSecret: null },
  });
  await logAudit("Settings", "Disable TOTP", "Authenticator app disabled");
  return { success: true };
}

export async function processRestock(transactionId: number) {
  await requireAdmin();
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

  // Fire-and-forget low stock alert after restock
  import("@/actions/email").then((m) => m.checkAndAlertLowStock());

  revalidatePath("/restocks");
  revalidatePath("/inventory");
  return txn;
}

export async function updateBuyerInfo(
  buyerName: string,
  data: { buyerAddress?: string; buyerContact?: string; buyerEmail?: string },
) {
  await requireAdmin();
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
  // Also update Buyer table
  const buyer = await prisma.buyer.findFirst({ where: { name: buyerName } });
  if (buyer) {
    await prisma.buyer.update({
      where: { id: buyer.id },
      data: {
        ...(data.buyerAddress !== undefined && { address: data.buyerAddress }),
        ...(data.buyerContact !== undefined && { phone: data.buyerContact }),
        ...(data.buyerEmail !== undefined && { email: data.buyerEmail }),
      },
    });
  }
  await logAudit(
    "Buyers",
    "Update Buyer Info",
    `${buyerName}: address/contact/email updated`,
  );
  revalidatePath("/buyers");
  return txns;
}

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
      label: `${start.toLocaleDateString("en-PH", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}`,
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

export async function getCashFlowTrend(days: number = 30) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
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
  const revMap = new Map<string, number>();
  for (const r of revenues) {
    const key = r.transactionDate.toISOString().split("T")[0];
    revMap.set(key, (revMap.get(key) || 0) + Number(r.grandTotal || 0));
  }
  const expMap = new Map<string, number>();
  for (const e of expenses) {
    const key = e.transactionDate.toISOString().split("T")[0];
    expMap.set(key, (expMap.get(key) || 0) + Number(e.grandTotal || 0));
  }
  const data: {
    date: string;
    revenue: number;
    expenses: number;
    net: number;
  }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const rev = revMap.get(dateStr) || 0;
    const exp = expMap.get(dateStr) || 0;
    data.push({
      date: d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
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
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const start = new Date();
  start.setDate(start.getDate() - days);
  const items = await prisma.transactionItem.findMany({
    where: {
      transaction: {
        transactionDate: { gte: start },
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

// ─────────── Paginated Audit Logs ───────────

export async function getAuditLogCount(opts?: {
  startDate?: string;
  endDate?: string;
  search?: string;
  panel?: string;
}) {
  const where: any = {};
  if (opts?.startDate) where.logTime = { gte: new Date(opts.startDate) };
  if (opts?.endDate)
    where.logTime = { ...where.logTime, lte: new Date(opts.endDate) };
  if (opts?.panel) where.panel = opts.panel;
  if (opts?.search)
    where.OR = [
      { action: { contains: opts.search, mode: "insensitive" } },
      { details: { contains: opts.search, mode: "insensitive" } },
      { panel: { contains: opts.search, mode: "insensitive" } },
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
  },
) {
  const where: any = {};
  if (opts?.startDate) where.logTime = { gte: new Date(opts.startDate) };
  if (opts?.endDate)
    where.logTime = { ...where.logTime, lte: new Date(opts.endDate) };
  if (opts?.panel) where.panel = opts.panel;
  if (opts?.search)
    where.OR = [
      { action: { contains: opts.search, mode: "insensitive" } },
      { details: { contains: opts.search, mode: "insensitive" } },
      { panel: { contains: opts.search, mode: "insensitive" } },
    ];
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { logTime: "desc" },
      include: { seller: { select: { sellerName: true } } },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { logs, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

// ─────────── Data Import ───────────

type ValidationError = { row: number; column: string; message: string };

export async function validateImportData(
  table: string,
  rows: Record<string, string>[],
): Promise<{
  valid: boolean;
  errors: ValidationError[];
  preview: Record<string, string>[];
}> {
  const config = IMPORT_CONFIGS[table];
  if (!config)
    return {
      valid: false,
      errors: [{ row: 0, column: "", message: `Unknown table: "${table}"` }],
      preview: [],
    };

  const errors: ValidationError[] = [];
  const preview: Record<string, string>[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const previewRow: Record<string, string> = {};
    const rowNum = i + 2; // +2 for header row + 1-indexed

    for (const col of config.columns) {
      const val = (row[col.label] ?? row[col.key] ?? "").trim();

      if (col.required && !val) {
        errors.push({
          row: rowNum,
          column: col.label,
          message: `${col.label} is required`,
        });
        continue;
      }
      if (!val) {
        previewRow[col.key] = "";
        continue;
      }

      if (col.type === "number") {
        const num = Number(val);
        if (isNaN(num))
          errors.push({
            row: rowNum,
            column: col.label,
            message: `"${val}" is not a valid number`,
          });
        else previewRow[col.key] = String(num);
      } else if (col.type === "date") {
        const d = new Date(val);
        if (isNaN(d.getTime()))
          errors.push({
            row: rowNum,
            column: col.label,
            message: `"${val}" is not a valid date`,
          });
        else previewRow[col.key] = d.toISOString();
      } else if (col.enum && !col.enum.includes(val)) {
        errors.push({
          row: rowNum,
          column: col.label,
          message: `"${val}" must be one of: ${col.enum.join(", ")}`,
        });
      } else {
        previewRow[col.key] = val;
      }
    }
    if (Object.keys(previewRow).length > 0) preview.push(previewRow);
  }

  return { valid: errors.length === 0, errors, preview };
}

export async function importData(
  table: string,
  rows: Record<string, string>[],
) {
  await requireAdmin();
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const validation = await validateImportData(table, rows);
  if (!validation.valid)
    throw new Error(
      `Validation failed: ${validation.errors.length} error(s). First: ${validation.errors[0].message}`,
    );

  let count = 0;
  const userId = Number(session.user.id);
  const userName = session.user.name || "Unknown";

  switch (table) {
    case "products":
    case "inventory": {
      for (const row of validation.preview) {
        const unitPrice = parseFloat(row.unitPrice);
        const quantity = parseInt(row.quantity);
        const minThreshold = parseInt(row.minThreshold || "0");
        let categoryId: number | undefined;
        const cat = await prisma.category.findFirst({
          where: { name: { contains: row.category, mode: "insensitive" } },
        });
        if (cat) categoryId = cat.id;
        await prisma.product.create({
          data: {
            productName: row.productName,
            category: row.category,
            categoryId,
            supplierName: row.supplierName || "",
            unitPrice,
            quantity,
            minThreshold,
            imageUrl: row.imageUrl || null,
            isAvailable: quantity > 0,
          },
        });
        count++;
      }
      break;
    }
    case "buyers": {
      for (const row of validation.preview) {
        const existing = await prisma.buyer.findFirst({
          where: { name: row.buyerName },
        });
        if (!existing) {
          await prisma.buyer.create({
            data: {
              name: row.buyerName,
              address: row.buyerAddress || null,
              phone: row.buyerContact || null,
              totalOrders: parseInt(row.totalOrders || "0"),
              totalSpent: parseFloat(row.totalSpent || "0"),
              sellerId: userId,
            },
          });
          count++;
        }
      }
      break;
    }
    case "suppliers": {
      for (const row of validation.preview) {
        await prisma.supplier.create({
          data: {
            supplierName: row.supplierName,
            contactName: row.contactName || null,
            contactNumber: row.contactNumber || null,
            email: row.email || null,
            address: row.address || null,
            isAvailable: true,
          },
        });
        count++;
      }
      break;
    }
    default:
      throw new Error(`Import not supported for table: "${table}"`);
  }

  await logAudit(
    "Data Import",
    `Import ${table}`,
    `Imported ${count} ${table} via CSV`,
  );
  revalidatePath(`/${table}`);
  return { imported: count };
}

// ─────────── User Management (Admin) ───────────

export async function getUsers(opts?: {
  search?: string;
  page?: number;
  perPage?: number;
}) {
  await requireAdmin();
  const where: any = {};
  if (opts?.search) {
    where.OR = [
      { sellerName: { contains: opts.search, mode: "insensitive" } },
      { username: { contains: opts.search, mode: "insensitive" } },
      { email: { contains: opts.search, mode: "insensitive" } },
    ];
  }
  const take = opts?.perPage || 20;
  const skip = ((opts?.page || 1) - 1) * take;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { sellerName: "asc" },
      select: {
        id: true,
        sellerName: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLogin: true,
        registryDate: true,
        _count: { select: { transactions: true } },
      },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);
  return {
    users,
    total,
    page: opts?.page || 1,
    totalPages: Math.ceil(total / take),
  };
}

export async function createUser(data: {
  sellerName: string;
  username: string;
  email: string;
  password: string;
  role: "ADMIN" | "STAFF";
}) {
  await requireAdmin();
  const bcrypt = await import("bcryptjs");
  const exists = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: data.username, mode: "insensitive" } },
        { email: { equals: data.email, mode: "insensitive" } },
      ],
    },
  });
  if (exists) throw new Error("Username or email already exists");
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      sellerName: data.sellerName,
      username: data.username,
      email: data.email,
      passwordHash,
      role: data.role,
      isActive: true,
      registryDate: new Date(),
      lastLogin: new Date(),
    },
  });
  await logAudit(
    "User Management",
    "Create User",
    `Created user ${user.sellerName} (${data.role})`,
  );
  revalidatePath("/users");
  return { id: user.id };
}

export async function updateUser(
  id: number,
  data: {
    sellerName?: string;
    username?: string;
    email?: string;
    role?: "ADMIN" | "STAFF";
    isActive?: boolean;
    password?: string;
  },
) {
  await requireAdmin();
  const updateData: any = {};
  if (data.sellerName !== undefined) updateData.sellerName = data.sellerName;
  if (data.username !== undefined) updateData.username = data.username;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.password) {
    const bcrypt = await import("bcryptjs");
    updateData.oldPasswordHash = null;
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }
  const user = await prisma.user.update({ where: { id }, data: updateData });
  await logAudit(
    "User Management",
    "Update User",
    `Updated user ${user.sellerName} (id=${id})`,
  );
  revalidatePath("/users");
  return { id: user.id };
}

export async function deleteUser(id: number) {
  await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");
  if (user.role === "ADMIN") {
    throw new Error("Cannot deactivate ADMIN users. Change role to STAFF first.");
  }
  await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });
  const action = user.isActive ? "Deactivated" : "Activated";
  await logAudit(
    "User Management",
    `${action} User`,
    `${action} user ${user.sellerName} (id=${id})`,
  );
  revalidatePath("/users");
  return { success: true };
}
