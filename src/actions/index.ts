/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

"use server";

import { Prisma } from "@prisma/client";
import { prisma, invalidateUserCache } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { logAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { withTimeout } from "@/lib/timeout";
import { IMPORT_CONFIGS } from "@/lib/import-configs";
import { actionFingerprint } from "@/lib/access";
import {
  requireAdmin,
  requireSuperAdmin,
  requireUser,
} from "@/lib/server-access";
import { formatMoney } from "@/lib/format";
import { createTotpSecret, verifyTotp } from "@/lib/totp";
import { cache } from "react";

const DB_TIMEOUT = 20000;

// ─────────── Products ───────────

export async function getProducts(opts?: {
  categoryId?: number;
  supplierId?: number;
  brandId?: number;
  search?: string;
  status?: string;
}) {
  try {
    const where: any = {};
    if (opts?.categoryId) where.categoryId = opts.categoryId;
    if (opts?.supplierId) where.supplierId = opts.supplierId;
    if (opts?.brandId) where.brandId = opts.brandId;
    if (opts?.search) {
      where.OR = [{ productName: { contains: opts.search } }];
    }
    if (opts?.status === "low")
      where.quantity = { lte: prisma.product.fields.minThreshold };
    if (opts?.status === "out") where.quantity = 0;
    if (opts?.status === "available") where.isAvailable = true;

    return withTimeout(
      prisma.product.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        include: { categoryRel: true, supplierRel: true, brandRel: true },
      }),
      DB_TIMEOUT,
      "Loading products",
    );
  } catch {
    return [] as any[];
  }
}

export async function getProduct(id: number) {
  return prisma.product.findUnique({
    where: { id },
    include: { categoryRel: true, supplierRel: true, brandRel: true },
  });
}

export async function getPendingPOQuantities(): Promise<
  Record<number, number>
> {
  const pendingItems = await prisma.transactionItem.findMany({
    where: {
      transaction: {
        transactionType: "SalePO",
        transactionStatus: { in: ["Ongoing", "Processing", "OnTheWay"] },
      },
    },
    select: { productId: true, quantity: true },
  });
  const map: Record<number, number> = {};
  for (const item of pendingItems) {
    if (item.productId) {
      map[item.productId] = (map[item.productId] || 0) + (item.quantity || 0);
    }
  }
  return map;
}

function normalizeLookupName(value?: string | null) {
  return (value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function assertNonNegative(value: number | undefined, label: string) {
  if (value !== undefined && value < 0) {
    throw new Error(`${label} cannot be below zero.`);
  }
}

async function resolveProductCategory(
  categoryId?: number | null,
  categoryName?: string,
) {
  const name = categoryName?.trim().replace(/\s+/g, " ");
  if (!name) {
    return { categoryId: categoryId ?? null, category: "Uncategorized" };
  }

  const categories = await prisma.category.findMany({
    where: { parentCategoryId: null },
    select: { id: true, name: true },
  });
  const existing = categories.find(
    (cat) => normalizeLookupName(cat.name) === normalizeLookupName(name),
  );
  if (existing) return { categoryId: existing.id, category: existing.name };

  const created = await prisma.category.create({
    data: { name, parentCategoryId: null, createdAt: new Date() },
  });
  await logAudit("InventoryPanel", "Add Category", `${created.name} created`);
  return { categoryId: created.id, category: created.name };
}

async function resolveProductBrand(
  brandId?: number | null,
  brandName?: string,
) {
  const name = brandName?.trim().replace(/\s+/g, " ");
  if (!name) return brandId ?? null;

  const brands = await prisma.brand.findMany({
    select: { id: true, name: true },
  });
  const existing = brands.find(
    (brand) => normalizeLookupName(brand.name) === normalizeLookupName(name),
  );
  if (existing) return existing.id;

  const created = await prisma.brand.create({
    data: { name, createdAt: new Date() },
  });
  await logAudit("InventoryPanel", "Add Brand", `${created.name} created`);
  return created.id;
}

async function resolveProductSupplier(
  supplierId?: number | null,
  supplierName?: string,
) {
  const name = supplierName?.trim().replace(/\s+/g, " ");
  if (!name) return { supplierId: supplierId ?? null, supplierName: "" };

  const suppliers = await prisma.supplier.findMany({
    select: { id: true, supplierName: true },
  });
  const existing = suppliers.find(
    (s) => normalizeLookupName(s.supplierName) === normalizeLookupName(name),
  );
  if (existing)
    return { supplierId: existing.id, supplierName: existing.supplierName };

  const created = await prisma.supplier.create({
    data: { supplierName: name },
  });
  await logAudit(
    "InventoryPanel",
    "Add Supplier",
    `${created.supplierName} created`,
  );
  return { supplierId: created.id, supplierName: created.supplierName };
}

async function assertUniqueProductName(
  productName: string,
  categoryId: number | null,
  brandId: number | null,
  currentProductId?: number,
) {
  const products = await prisma.product.findMany({
    where: {
      categoryId,
      brandId,
      ...(currentProductId ? { id: { not: currentProductId } } : {}),
    },
    select: { productName: true },
  });
  const normalized = normalizeLookupName(productName);
  const duplicate = products.some(
    (product) => normalizeLookupName(product.productName) === normalized,
  );
  if (duplicate) {
    throw new Error(
      "A product with this name already exists in the selected category and brand.",
    );
  }
}

export async function createProduct(data: {
  productName: string;
  categoryId?: number;
  categoryName?: string;
  category: string;
  supplierId?: number;
  supplierName: string;
  brandId?: number;
  brandName?: string;
  unitPrice?: number;
  sellingPrice: number;
  quantity: number;
  minThreshold: number;
  imageUrl?: string;
  isFastMoving?: boolean;
  sellByWeight?: boolean;
  sellByBox?: boolean;
  boxQuantity?: number;
}) {
  await requireUser();
  const productName = data.productName.trim().replace(/\s+/g, " ");
  if (!productName) throw new Error("Product name is required.");
  assertNonNegative(data.sellingPrice, "Selling Price");
  assertNonNegative(data.unitPrice, "Unit Price");

  const category = await resolveProductCategory(
    data.categoryId,
    data.categoryName || data.category,
  );
  const brandId = await resolveProductBrand(data.brandId, data.brandName);
  const resolvedSupplier = await resolveProductSupplier(
    data.supplierId,
    data.supplierName,
  );
  await assertUniqueProductName(productName, category.categoryId, brandId);

  const { categoryName, brandName, ...productData } = data;
  const product = await prisma.product.create({
    data: {
      ...productData,
      productName,
      categoryId: category.categoryId,
      category: category.category,
      brandId,
      supplierId: resolvedSupplier.supplierId,
      supplierName: resolvedSupplier.supplierName || "Unknown",
      isAvailable: true,
    },
  });
  await logAudit(
    "ProductDialog",
    "Add Product",
    `${product.productName} created`,
  );
  revalidatePath("/inventory");
  revalidatePath("/categories");
  revalidatePath("/brands");
  revalidateTag("products", "default");
  revalidateTag("categories", "default");
  revalidateTag("brands", "default");
  return product;
}

export async function updateProduct(
  id: number,
  data: Partial<{
    productName: string;
    categoryId: number | null;
    categoryName: string;
    category: string;
    supplierId: number | null;
    supplierName: string;
    brandId: number | null;
    brandName: string;
    unitPrice: number;
    sellingPrice: number;
    quantity: number;
    minThreshold: number;
    isAvailable: boolean;
    imageUrl: string;
    isFastMoving: boolean;
    sellByWeight: boolean;
    sellByBox: boolean;
    boxQuantity: number;
  }>,
) {
  await requireUser();
  const current = await prisma.product.findUniqueOrThrow({ where: { id } });
  const productName = data.productName
    ? data.productName.trim().replace(/\s+/g, " ")
    : current.productName;
  if (!productName) throw new Error("Product name is required.");
  assertNonNegative(data.sellingPrice, "Selling Price");
  assertNonNegative(data.unitPrice, "Unit Price");

  const category =
    data.categoryName !== undefined ||
    data.category !== undefined ||
    data.categoryId !== undefined
      ? await resolveProductCategory(
          data.categoryId ?? null,
          data.categoryName || data.category,
        )
      : { categoryId: current.categoryId, category: current.category };
  const brandId =
    data.brandName !== undefined || data.brandId !== undefined
      ? await resolveProductBrand(data.brandId ?? null, data.brandName)
      : current.brandId;
  const resolvedSupplier =
    data.supplierName !== undefined || data.supplierId !== undefined
      ? await resolveProductSupplier(data.supplierId ?? null, data.supplierName)
      : { supplierId: current.supplierId, supplierName: current.supplierName };

  await assertUniqueProductName(productName, category.categoryId, brandId, id);

  const { categoryName, brandName, ...productData } = data;
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...productData,
      productName,
      categoryId: category.categoryId,
      category: category.category,
      brandId,
      supplierId: resolvedSupplier.supplierId,
      supplierName: resolvedSupplier.supplierName || "Unknown",
    },
  });
  await logAudit(
    "InventoryPanel",
    "Edit Product",
    `${product.productName} (#${id}) updated`,
  );
  revalidatePath("/inventory");
  revalidatePath("/categories");
  revalidatePath("/brands");
  revalidateTag("products", "default");
  revalidateTag("categories", "default");
  revalidateTag("brands", "default");
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
  revalidateTag("products", "default");
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
  revalidateTag("products", "default");
  return updated;
}

export async function deleteProduct(id: number) {
  await requireAdmin();
  const product = await prisma.product.findUniqueOrThrow({ where: { id } });
  if (product.quantity > 0) {
    throw new Error("Cannot delete product while it still has stock.");
  }
  await prisma.product.delete({ where: { id } });
  await logAudit(
    "InventoryPanel",
    "Delete Product",
    `${product.productName} (#${id}) deleted`,
  );
  revalidatePath("/inventory");
  revalidateTag("products", "default");
}

export async function deleteProducts(ids: number[]) {
  await requireAdmin();
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
  });
  const blocked = products.filter((product) => product.quantity > 0);
  if (blocked.length > 0) {
    throw new Error(
      `Cannot delete ${blocked.length} product(s) while they still have stock.`,
    );
  }
  const result = await prisma.product.deleteMany({
    where: { id: { in: ids } },
  });
  await logAudit(
    "InventoryPanel",
    "Delete Products (Bulk)",
    `${result.count} product(s) deleted (IDs: ${ids.join(", ")})`,
  );
  revalidatePath("/inventory");
  revalidateTag("products", "default");
  return {
    deleted: result.count,
    skipped: ids.length - result.count,
    names: products.map((p) => p.productName),
  };
}

// ─────────── Categories ───────────

export const getCategories = cache(async () => {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
});

export const getAllCategories = cache(async () => {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
});

export async function createCategory(name: string, parentCategoryId?: number) {
  await requireUser();
  try {
    const cat = await prisma.category.create({
      data: {
        name,
        parentCategoryId: parentCategoryId || null,
        createdAt: new Date(),
      },
    });
    await logAudit(
      "InventoryPanel",
      "Add Category",
      parentCategoryId
        ? `Subcategory "${name}" created under #${parentCategoryId}`
        : `${cat.name} created`,
    );
    revalidatePath("/inventory");
    revalidatePath("/categories");
    revalidateTag("categories", "default");
    return cat;
  } catch (e: any) {
    if (e?.code === "P2002") {
      throw new Error(
        `A category named "${name}" already exists in this parent.`,
      );
    }
    throw e;
  }
}

export async function editCategory(
  id: number,
  name: string,
  parentCategoryId?: number,
) {
  await requireUser();

  // Prevent circular nesting: check if new parent is a descendant of this category
  if (parentCategoryId && parentCategoryId === id) {
    throw new Error("A category cannot be its own parent.");
  }
  if (parentCategoryId) {
    const descendants = await prisma.category.findMany({
      where: { parentCategoryId: id },
      select: { id: true },
    });
    const descendantIds = descendants.map((d) => d.id);
    if (descendantIds.includes(parentCategoryId)) {
      throw new Error("Cannot assign a subcategory as its own parent.");
    }
  }

  try {
    const cat = await prisma.category.update({
      where: { id },
      data: {
        name,
        parentCategoryId:
          parentCategoryId !== undefined ? parentCategoryId || null : undefined,
      },
    });
    await logAudit(
      "InventoryPanel",
      "Edit Category",
      `Category #${id} renamed to "${name}"`,
    );
    revalidatePath("/inventory");
    revalidatePath("/categories");
    revalidateTag("categories", "default");
    return cat;
  } catch (e: any) {
    if (e?.code === "P2002") {
      throw new Error(
        `A category named "${name}" already exists in this parent.`,
      );
    }
    throw e;
  }
}

export async function deleteCategory(id: number) {
  await requireAdmin();
  const children = await prisma.category.count({
    where: { parentCategoryId: id },
  });
  if (children > 0) {
    throw new Error(
      `Cannot delete category: it has ${children} subcategory(ies). Remove them first.`,
    );
  }
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
  revalidateTag("categories", "default");
}

export async function deleteCategories(ids: number[]) {
  await requireAdmin();
  const results: {
    deleted: string[];
    skipped: { id: number; reason: string }[];
  } = { deleted: [], skipped: [] };
  for (const id of ids) {
    try {
      const linked = await prisma.product.count({ where: { categoryId: id } });
      if (linked > 0) {
        const cat = await prisma.category.findUniqueOrThrow({ where: { id } });
        results.skipped.push({
          id,
          reason: `${cat.name} has ${linked} product(s)`,
        });
        continue;
      }
      const children = await prisma.category.count({
        where: { parentCategoryId: id },
      });
      if (children > 0) {
        const cat = await prisma.category.findUniqueOrThrow({ where: { id } });
        results.skipped.push({
          id,
          reason: `${cat.name} has ${children} subcategory(ies)`,
        });
        continue;
      }
      const cat = await prisma.category.findUniqueOrThrow({ where: { id } });
      await prisma.category.delete({ where: { id } });
      results.deleted.push(cat.name);
    } catch (e: any) {
      results.skipped.push({ id, reason: e?.message || "Unknown error" });
    }
  }
  if (results.deleted.length > 0) {
    await logAudit(
      "InventoryPanel",
      "Delete Categories (Bulk)",
      `${results.deleted.length} category(ies) deleted: ${results.deleted.join(", ")}`,
    );
    revalidatePath("/inventory");
    revalidatePath("/categories");
    revalidateTag("categories", "default");
  }
  return { deleted: results.deleted.length, skipped: results.skipped };
}

// ─────────── Brands ───────────

export const getBrands = cache(async () => {
  return prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
});

export async function createBrand(name: string) {
  await requireUser();
  try {
    const brand = await prisma.brand.create({
      data: { name, createdAt: new Date() },
    });
    await logAudit("InventoryPanel", "Add Brand", `${brand.name} created`);
    revalidatePath("/inventory");
    revalidatePath("/brands");
    revalidateTag("brands", "default");
    return brand;
  } catch (e: any) {
    if (e?.code === "P2002") {
      throw new Error(`A brand named "${name}" already exists.`);
    }
    throw e;
  }
}

export async function editBrand(id: number, name: string) {
  await requireUser();
  try {
    const brand = await prisma.brand.update({ where: { id }, data: { name } });
    await logAudit(
      "InventoryPanel",
      "Edit Brand",
      `Brand #${id} renamed to "${name}"`,
    );
    revalidatePath("/inventory");
    revalidatePath("/brands");
    revalidateTag("brands", "default");
    return brand;
  } catch (e: any) {
    if (e?.code === "P2002") {
      throw new Error(`A brand named "${name}" already exists.`);
    }
    throw e;
  }
}

export async function deleteBrand(id: number) {
  await requireAdmin();
  const linked = await prisma.product.count({ where: { brandId: id } });
  if (linked > 0) {
    throw new Error(
      `Cannot delete brand: ${linked} product(s) are linked to it. Remove or reassign them first.`,
    );
  }
  const brand = await prisma.brand.findUniqueOrThrow({ where: { id } });
  await prisma.brand.delete({ where: { id } });
  await logAudit(
    "InventoryPanel",
    "Delete Brand",
    `${brand.name} (#${id}) deleted`,
  );
  revalidatePath("/inventory");
  revalidatePath("/brands");
  revalidateTag("brands", "default");
}

export async function deleteBrands(ids: number[]) {
  await requireAdmin();
  const results: {
    deleted: string[];
    skipped: { id: number; reason: string }[];
  } = { deleted: [], skipped: [] };
  for (const id of ids) {
    try {
      const linked = await prisma.product.count({ where: { brandId: id } });
      if (linked > 0) {
        const brand = await prisma.brand.findUniqueOrThrow({ where: { id } });
        results.skipped.push({
          id,
          reason: `${brand.name} has ${linked} product(s)`,
        });
        continue;
      }
      const brand = await prisma.brand.findUniqueOrThrow({ where: { id } });
      await prisma.brand.delete({ where: { id } });
      results.deleted.push(brand.name);
    } catch (e: any) {
      results.skipped.push({ id, reason: e?.message || "Unknown error" });
    }
  }
  if (results.deleted.length > 0) {
    await logAudit(
      "InventoryPanel",
      "Delete Brands (Bulk)",
      `${results.deleted.length} brand(s) deleted: ${results.deleted.join(", ")}`,
    );
    revalidatePath("/inventory");
    revalidatePath("/brands");
    revalidateTag("brands", "default");
  }
  return { deleted: results.deleted.length, skipped: results.skipped };
}

// ─────────── Suppliers ───────────

export const getSuppliers = cache(async () => {
  return prisma.supplier.findMany({
    orderBy: { supplierName: "asc" },
    include: { _count: { select: { products: true } } },
  });
});

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
  tin?: string;
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
      revalidateTag("suppliers", "default");
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
    tin: string;
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
  revalidateTag("suppliers", "default");
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
  revalidateTag("suppliers", "default");
}

export async function deleteSuppliers(ids: number[]) {
  await requireAdmin();
  const results: {
    deleted: string[];
    skipped: { id: number; reason: string }[];
  } = { deleted: [], skipped: [] };
  for (const id of ids) {
    try {
      const supplier = await prisma.supplier.findUniqueOrThrow({
        where: { id },
        include: { _count: { select: { products: true } } },
      });
      if (supplier._count.products > 0) {
        results.skipped.push({
          id,
          reason: `${supplier.supplierName} has ${supplier._count.products} product(s)`,
        });
        continue;
      }
      await prisma.supplier.delete({ where: { id } });
      results.deleted.push(supplier.supplierName);
    } catch (e: any) {
      results.skipped.push({ id, reason: e?.message || "Unknown error" });
    }
  }
  if (results.deleted.length > 0) {
    await logAudit(
      "SupplierPanel",
      "Delete Suppliers (Bulk)",
      `${results.deleted.length} supplier(s) deleted: ${results.deleted.join(", ")}`,
    );
    revalidatePath("/suppliers");
    revalidateTag("suppliers", "default");
  }
  return { deleted: results.deleted.length, skipped: results.skipped };
}

// ─────────── Transactions ───────────

function buildTransactionWhere(opts?: {
  status?: string;
  statusIn?: string[];
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  paymentMethod?: string;
}) {
  const where: any = {};
  if (opts?.status) where.transactionStatus = opts.status;
  if (opts?.statusIn) where.transactionStatus = { in: opts.statusIn };
  if (opts?.type) where.transactionType = opts.type;
  if (opts?.paymentMethod) where.paymentMethod = opts.paymentMethod;
  if (opts?.startDate)
    where.transactionDate = { gte: new Date(opts.startDate) };
  if (opts?.endDate) {
    where.transactionDate = {
      ...where.transactionDate,
      lte: new Date(opts.endDate + "T23:59:59"),
    };
  }
  if (opts?.search) {
    const or: any[] = [{ buyerName: { contains: opts.search } }];
    const num = parseInt(opts.search);
    if (!isNaN(num)) or.push({ receiptNumber: num });
    where.OR = or;
  }
  return where;
}

function buildTransactionSqlWhere(opts?: {
  status?: string;
  statusIn?: string[];
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  paymentMethod?: string;
}) {
  const clauses: Prisma.Sql[] = [];

  if (opts?.status) {
    clauses.push(Prisma.sql`TRANSACTION_STATUS = ${opts.status}`);
  }
  if (opts?.statusIn?.length) {
    clauses.push(
      Prisma.sql`TRANSACTION_STATUS IN (${Prisma.join(opts.statusIn)})`,
    );
  }
  if (opts?.type) {
    clauses.push(Prisma.sql`TRANSACTION_TYPE = ${opts.type}`);
  }
  if (opts?.paymentMethod) {
    clauses.push(Prisma.sql`PAYMENT_METHOD = ${opts.paymentMethod}`);
  }
  if (opts?.startDate) {
    clauses.push(Prisma.sql`TRANSACTION_DATE >= ${new Date(opts.startDate)}`);
  }
  if (opts?.endDate) {
    clauses.push(
      Prisma.sql`TRANSACTION_DATE <= ${new Date(opts.endDate + "T23:59:59")}`,
    );
  }
  if (opts?.search) {
    const receipt = Number.parseInt(opts.search, 10);
    const buyerMatch = Prisma.sql`
      BUYER_NAME COLLATE utf8mb4_unicode_ci LIKE
      CONCAT('%', CAST(${opts.search} AS CHAR CHARACTER SET utf8mb4), '%')
      COLLATE utf8mb4_unicode_ci
    `;
    clauses.push(
      Number.isNaN(receipt)
        ? buyerMatch
        : Prisma.sql`(${buyerMatch} OR RECEIPT_NUMBER = ${receipt})`,
    );
  }

  return clauses;
}

function buildTransactionSqlWhereClause(opts?: {
  status?: string;
  statusIn?: string[];
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  paymentMethod?: string;
}) {
  const clauses = buildTransactionSqlWhere(opts);
  return clauses.length
    ? Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}`
    : Prisma.empty;
}

function transactionSortColumn(sortBy?: string) {
  switch (sortBy) {
    case "receiptNumber":
      return Prisma.sql`TRANSACTION_ID`;
    case "invoiceNumber":
      return Prisma.sql`INVOICE_NUMBER`;
    case "salesInvoiceNumber":
      return Prisma.sql`SALES_INVOICE_NUMBER`;
    case "deliveryReceiptNumber":
      return Prisma.sql`DELIVERY_RECEIPT_NUMBER`;
    case "buyerName":
      return Prisma.sql`BUYER_NAME`;
    case "transactionType":
      return Prisma.sql`TRANSACTION_TYPE`;
    case "transactionDate":
      return Prisma.sql`TRANSACTION_DATE`;
    case "paymentMethod":
      return Prisma.sql`PAYMENT_METHOD`;
    case "grandTotal":
      return Prisma.sql`GRAND_TOTAL`;
    case "transactionStatus":
      return Prisma.sql`TRANSACTION_STATUS`;
    case "sellerName":
      return Prisma.sql`SELLER_NAME`;
    case "isCredit":
      return Prisma.sql`IS_CREDIT`;
    default:
      return Prisma.sql`TRANSACTION_DATE`;
  }
}

export async function getTransactions(opts?: {
  status?: string;
  statusIn?: string[];
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  perPage?: number;
  paymentMethod?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}) {
  try {
    if (opts?.search) {
      const take = opts?.perPage || 100;
      const skip = ((opts?.page || 1) - 1) * take;
      const where = buildTransactionSqlWhereClause(opts);
      const orderColumn = transactionSortColumn(opts?.sortBy);
      const orderDirection =
        opts?.sortDir === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;
      const [rows] = await Promise.all([
        prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
          SELECT TRANSACTION_ID AS id
          FROM transactions
          ${where}
          ORDER BY ${orderColumn} ${orderDirection}, TRANSACTION_ID DESC
          LIMIT ${take} OFFSET ${skip}
        `),
      ]);
      const ids = rows.map((row) => row.id);
      if (ids.length === 0) return [] as any[];
      const transactions = await prisma.transaction.findMany({
        where: { id: { in: ids } },
        include: { items: true, seller: { select: { sellerName: true } } },
      });
      const byId = new Map(transactions.map((txn) => [txn.id, txn]));
      return ids.map((id) => byId.get(id)).filter(Boolean) as any[];
    }

    const where = buildTransactionWhere(opts);
    const take = opts?.perPage || 100;
    const skip = ((opts?.page || 1) - 1) * take;

    return withTimeout(
      prisma.transaction.findMany({
        where,
        orderBy: opts?.sortBy
          ? { [opts.sortBy]: opts.sortDir || "desc" }
          : { transactionDate: "desc" },
        include: { items: true, seller: { select: { sellerName: true } } },
        skip,
        take,
      }),
      DB_TIMEOUT,
      "Loading transactions",
    );
  } catch {
    return [] as any[];
  }
}

export async function getTransactionsCount(opts?: {
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  paymentMethod?: string;
}) {
  try {
    if (opts?.search) {
      const where = buildTransactionSqlWhereClause(opts);
      const rows = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
        SELECT COUNT(*) AS count
        FROM transactions
        ${where}
      `);
      return Number(rows[0]?.count || 0);
    }

    const where = buildTransactionWhere(opts);
    return prisma.transaction.count({ where });
  } catch {
    return 0;
  }
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
  invoiceNumber?: string;
  salesInvoiceNumber?: string;
  deliveryReceiptNumber?: string;
  tin?: string;
  isCredit?: boolean;
  creditDueDate?: Date;
  chequeDetails?: {
    chequeNumber?: string;
    bankName?: string;
    chequeDate?: Date;
    payeeName?: string;
  };
}) {
  const session = await auth();
  const sellerId = Number(session?.user?.id) || 0;
  const sellerName = session?.user?.name || "Unknown";

  const lastReceipt = await prisma.transaction.findFirst({
    orderBy: { receiptNumber: "desc" },
    select: { receiptNumber: true },
  });
  const receiptNumber = (lastReceipt?.receiptNumber ?? 1000) + 1;

  // Duplicate invoice check
  const invoiceFields = [
    { field: "Invoice", value: data.invoiceNumber },
    { field: "Sales Invoice", value: data.salesInvoiceNumber },
    { field: "Delivery Receipt", value: data.deliveryReceiptNumber },
  ];
  for (const inv of invoiceFields) {
    if (!inv.value) continue;
    const existingInvoice = await prisma.transaction.findFirst({
      where: {
        OR: [
          { invoiceNumber: inv.value },
          { salesInvoiceNumber: inv.value },
          { deliveryReceiptNumber: inv.value },
        ],
      },
      select: { id: true, receiptNumber: true },
    });
    if (existingInvoice) {
      throw new Error(
        `${inv.field} number "${inv.value}" already used on receipt #${existingInvoice.receiptNumber}`,
      );
    }
  }

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
        invoiceNumber: data.invoiceNumber,
        salesInvoiceNumber: data.salesInvoiceNumber,
        deliveryReceiptNumber: data.deliveryReceiptNumber,
        tin: data.tin,
        isCredit: data.isCredit || false,
        creditDueDate: data.creditDueDate,
        chequeNumber: data.chequeDetails?.chequeNumber || undefined,
        chequeBankName: data.chequeDetails?.bankName || undefined,
        chequeDate: data.chequeDetails?.chequeDate || undefined,
        chequePayeeName: data.chequeDetails?.payeeName || undefined,
        isReturned: data.transactionType === "Return",
        items: { create: itemsWithNames },
      },
    }),
    DB_TIMEOUT,
    "Processing transaction",
  );

  // Upsert buyer record (skip for internal/Restock — CWL Hardware names)
  let buyer: { id: number; email: string | null } | null = null;
  if (
    data.buyerName &&
    data.transactionType !== "Restock" &&
    !data.buyerName.startsWith("CWL Hardware")
  ) {
    buyer = await prisma.buyer.findFirst({
      where: { name: data.buyerName },
    });

    // Returns decrement totalSpent (refund), Damage/Adjustment don't affect it
    // SalePO skips totalSpent at creation — only incremented on completion
    const isReturn = data.transactionType === "Return";
    const isNonMonetary =
      data.transactionType === "Damage" ||
      data.transactionType === "Adjustment";
    const isSalePO = data.transactionType === "SalePO";
    const skipTotalSpent = isNonMonetary || isSalePO;

    if (buyer) {
      buyer = await prisma.buyer.update({
        where: { id: buyer.id },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: skipTotalSpent
            ? undefined
            : isReturn
              ? { decrement: data.grandTotal }
              : { increment: data.grandTotal },
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
          totalSpent: skipTotalSpent
            ? 0
            : isReturn
              ? -data.grandTotal
              : data.grandTotal,
          sellerId: sellerId || undefined,
        },
      });
    }
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { buyerId: buyer.id },
    });
  }
  // For credit sales, update buyer's credit balance (decrement for returns)
  if (data.isCredit && buyer) {
    const isReturn = data.transactionType === "Return";
    await prisma.buyer.update({
      where: { id: buyer.id },
      data: {
        creditBalance: isReturn
          ? { decrement: data.grandTotal }
          : { increment: data.grandTotal },
      },
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
  revalidateTag("buyers", "default");
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
  console.log(`[getReturnTransaction] lookup receiptNumber=${receiptNumber} (type=${typeof receiptNumber})`);
  const txn = await prisma.transaction.findFirst({
    where: { receiptNumber },
    include: {
      items: {
        include: { product: true },
      },
    },
  });
  console.log(`[getReturnTransaction] result=${txn ? `found id=${txn.id} type=${txn.transactionType} items=${txn.items.length}` : "null"}`);
  if (!txn) throw new Error(`Receipt #${receiptNumber} not found`);
  if (
    txn.transactionType === "Return" ||
    txn.transactionType === "Damage" ||
    txn.transactionType === "Adjustment"
  )
    throw new Error("Cannot reference another Return/Damage/Adjustment");
  return {
    buyerName: txn.buyerName,
    items: txn.items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
      product: i.product
        ? {
            id: i.product.id,
            productName: i.product.productName,
            sellingPrice: Number(i.product.sellingPrice),
            quantity: i.product.quantity,
          }
        : {
            id: i.productId ?? 0,
            productName: i.productName,
            sellingPrice: Number(i.unitPrice),
            quantity: 0,
          },
    })),
  };
}

export async function updateTransactionInvoice(
  id: number,
  field: "invoiceNumber" | "salesInvoiceNumber" | "deliveryReceiptNumber",
  value: string,
) {
  await requireAdmin();
  const txn = await prisma.transaction.findUniqueOrThrow({
    where: { id },
    select: { receiptNumber: true },
  });
  if (value) {
    const existing = await prisma.transaction.findFirst({
      where: { [field]: value, id: { not: id } },
      select: { id: true, receiptNumber: true },
    });
    if (existing) {
      throw new Error(
        `Invoice number "${value}" already used on receipt #${existing.receiptNumber}`,
      );
    }
  }
  await prisma.transaction.update({
    where: { id },
    data: { [field]: value || null },
  });
  const label =
    field === "salesInvoiceNumber"
      ? "Sales Invoice"
      : field === "deliveryReceiptNumber"
        ? "Delivery Receipt"
        : "Invoice";
  await logAudit(
    "Transactions",
    "Update Invoice",
    `#${txn.receiptNumber}: ${label} set to "${value}"`,
  );
  revalidatePath("/transactions");
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

  // If completing a Sale PO, deduct stock and record totalSpent
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
    // Increment buyer totalSpent now that money is received
    if (txn.buyerName) {
      const buyer = await prisma.buyer.findFirst({
        where: { name: txn.buyerName },
      });
      if (buyer) {
        await prisma.buyer.update({
          where: { id: buyer.id },
          data: {
            totalSpent: { increment: Number(txn.grandTotal) },
          },
        });
      }
    }
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

  // If cancelling a Return, reverse the totalSpent decrement (refund undone)
  if (
    status === "Cancelled" &&
    txn.transactionStatus !== "Cancelled" &&
    txn.transactionType === "Return" &&
    txn.buyerName
  ) {
    const buyer = await prisma.buyer.findFirst({
      where: { name: txn.buyerName },
    });
    if (buyer) {
      await prisma.buyer.update({
        where: { id: buyer.id },
        data: {
          totalSpent: { increment: Number(txn.grandTotal) },
          totalOrders: { decrement: 1 },
        },
      });
    }
  }

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
    isCredit?: boolean;
    creditDueDate?: string | null;
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
      isCredit: data.isCredit,
      creditDueDate: data.creditDueDate
        ? new Date(data.creditDueDate)
        : undefined,
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

export async function markCreditAsPaid(id: number) {
  await requireAdmin();
  const txn = await prisma.transaction.findUniqueOrThrow({ where: { id } });
  if (!txn.isCredit) throw new Error("Transaction is not a credit sale");
  if (txn.creditPaidAt) throw new Error("Credit is already marked as paid");
  const updated = await prisma.transaction.update({
    where: { id },
    data: { creditPaidAt: new Date() },
  });
  await logAudit(
    "Transactions",
    "Mark Credit Paid",
    `#${txn.receiptNumber} credit marked as paid`,
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

// ─────────── Notifications ───────────

export async function getNotifications(
  userId: number,
  page: number = 1,
  limit: number = 10,
) {
  const skip = (page - 1) * limit;
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
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

export async function deleteNotification(id: number) {
  await requireAdmin();
  await prisma.notification.delete({ where: { id } });
  await logAudit(
    "System",
    "Delete Notification",
    `Notification #${id} deleted`,
  );
  revalidatePath("/notifications");
}

export async function getUnreadNotificationCount(userId: number) {
  const total = await prisma.notification.count();
  const read = await prisma.notificationRead.count({ where: { userId } });
  return total - read;
}

// ─────────── Buyers ───────────

export const getBuyers = cache(async (type?: "WalkIn" | "PO") => {
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

  const merged = buyerRecords.map((b: any) => ({
    buyerName: b.name,
    totalOrders: b.totalOrders,
    totalSpent: Number(b.totalSpent),
    buyerAddress: b.address,
    buyerContact: b.phone,
    buyerEmail: b.email,
    imageUrl: b.imageUrl,
    lastOrder: latestMap.get(b.name) || null,
  }));

  // Include legacy buyers from transactions not yet in Buyer table
  const existingNames = new Set(buyerRecords.map((b) => b.name));
  const legacyWhere: any = {
    buyerName: { notIn: Array.from(existingNames) },
    transactionStatus: { not: "Cancelled" },
  };
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
        imageUrl: null,
        lastOrder: info.lastOrder || null,
      });
    }
  }

  merged.sort((a, b) => b.totalSpent - a.totalSpent);
  return merged.filter((b) => !b.buyerName.startsWith("CWL Hardware"));
});

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
  invalidateUserCache(Number(session.user.id));
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
  invalidateUserCache(Number(session.user.id));
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
  invalidateUserCache(userId);
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
  invalidateUserCache(userId);
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
  invalidateUserCache(userId);
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
        unitPrice: item.costPrice ?? undefined,
        lastRestockedAt: new Date(),
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

export async function createBuyer(data: {
  name: string;
  address?: string;
  contact?: string;
  email?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const sellerId = Number(session.user.id);
  const existing = await prisma.buyer.findFirst({
    where: { name: data.name },
  });
  if (existing) throw new Error("A buyer with this name already exists.");
  const buyer = await prisma.buyer.create({
    data: {
      name: data.name,
      address: data.address || null,
      phone: data.contact || null,
      email: data.email || null,
      sellerId: sellerId || undefined,
    },
  });
  await logAudit("Buyers", "Add Buyer", `${data.name} created`);
  revalidatePath("/buyers");
  revalidateTag("buyers", "default");
  return buyer;
}

export async function updateBuyerInfo(
  buyerName: string,
  data: {
    buyerAddress?: string;
    buyerContact?: string;
    buyerEmail?: string;
    imageUrl?: string | null;
  },
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
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      },
    });
  }
  await logAudit(
    "Buyers",
    "Update Buyer Info",
    `${buyerName}: address/contact/email/image updated`,
  );
  revalidatePath("/buyers");
  revalidateTag("buyers", "default");
  return txns;
}

// ─────────── Custom Downloadables ───────────

export async function getCustomDownloadables() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return prisma.customDownloadable.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      fileName: true,
      fileType: true,
      fileSize: true,
      createdAt: true,
      uploadedBy: true,
    },
  });
}

export async function createCustomDownloadable(data: {
  name: string;
  description?: string;
  fileName: string;
  fileData: string;
  fileType: string;
  fileSize: number;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = Number(session.user.id);
  const item = await prisma.customDownloadable.create({
    data: {
      name: data.name,
      description: data.description || null,
      fileName: data.fileName,
      fileData: data.fileData,
      fileType: data.fileType,
      fileSize: data.fileSize,
      uploadedBy: userId || undefined,
    },
  });
  await logAudit(
    "Downloadables",
    "Add File",
    `${data.name} (${data.fileName}) uploaded`,
  );
  revalidatePath("/downloadables");
  return item;
}

export async function deleteCustomDownloadable(id: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const item = await prisma.customDownloadable.findUniqueOrThrow({
    where: { id },
  });
  await prisma.customDownloadable.delete({ where: { id } });
  await logAudit("Downloadables", "Delete File", `${item.name} deleted`);
  revalidatePath("/downloadables");
}

export async function getCustomDownloadableData(id: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const item = await prisma.customDownloadable.findUniqueOrThrow({
    where: { id },
    select: { fileData: true, fileName: true, fileType: true },
  });
  return item;
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
  if (opts?.startDate) where.logTime = { gte: new Date(opts.startDate) };
  if (opts?.endDate)
    where.logTime = {
      ...where.logTime,
      lte: new Date(opts.endDate + "T23:59:59"),
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
        const sellingPrice = parseFloat(
          row.sellingPrice || row.unitPrice || "0",
        );
        const costPrice = parseFloat(row.costPrice || "0") || undefined;
        const quantity = parseInt(row.quantity);
        const minThreshold = parseInt(row.minThreshold || "0");
        let categoryId: number | undefined;
        const cat = await prisma.category.findFirst({
          where: { name: { contains: row.category } },
        });
        if (cat) categoryId = cat.id;
        await prisma.product.create({
          data: {
            productName: row.productName,
            category: row.category,
            categoryId,
            supplierName: row.supplierName || "",
            sellingPrice,
            unitPrice: costPrice,
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
      { sellerName: { contains: opts.search } },
      { username: { contains: opts.search } },
      { email: { contains: opts.search } },
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
        imageUrl: true,
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
  role: "SUPERADMIN" | "ADMIN" | "STAFF";
}) {
  await requireAdmin();
  const bcrypt = await import("bcryptjs");
  const exists = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: data.username } },
        { email: { equals: data.email } },
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
    role?: "SUPERADMIN" | "ADMIN" | "STAFF";
    isActive?: boolean;
    password?: string;
  },
) {
  await requireAdmin();
  const session = await auth();
  const currentRole = (session?.user as any)?.role;

  // Check if target user is ADMIN
  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) throw new Error("User not found");

  // Only SUPERADMIN can edit ADMIN users
  if (targetUser.role === "ADMIN" && currentRole !== "SUPERADMIN") {
    throw new Error("Only SUPERADMIN can edit ADMIN users");
  }

  // Only SUPERADMIN can edit SUPERADMIN users
  if (targetUser.role === "SUPERADMIN" && currentRole !== "SUPERADMIN") {
    throw new Error("Only SUPERADMIN can edit SUPERADMIN users");
  }

  // Only SUPERADMIN can promote to SUPERADMIN
  if (data.role === "SUPERADMIN" && currentRole !== "SUPERADMIN") {
    throw new Error("Only SUPERADMIN can promote to SUPERADMIN");
  }

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
  invalidateUserCache(id);
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
  const session = await auth();
  const currentRole = (session?.user as any)?.role;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");

  // Only SUPERADMIN can deactivate ADMIN users
  if (user.role === "ADMIN" && currentRole !== "SUPERADMIN") {
    throw new Error("Only SUPERADMIN can deactivate ADMIN users");
  }

  // Cannot deactivate SUPERADMIN
  if (user.role === "SUPERADMIN") {
    throw new Error("Cannot deactivate SUPERADMIN users");
  }
  await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });
  invalidateUserCache(id);
  const action = user.isActive ? "Deactivated" : "Activated";
  await logAudit(
    "User Management",
    `${action} User`,
    `${action} user ${user.sellerName} (id=${id})`,
  );
  revalidatePath("/users");
  return { success: true };
}

export async function bulkToggleUsers(ids: number[], activate: boolean) {
  await requireAdmin();
  const session = await auth();
  const currentRole = (session?.user as any)?.role;
  const results: {
    updated: string[];
    skipped: { id: number; reason: string }[];
  } = { updated: [], skipped: [] };
  for (const id of ids) {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        results.skipped.push({ id, reason: "Not found" });
        continue;
      }
      if (user.role === "SUPERADMIN") {
        results.skipped.push({
          id,
          reason: `${user.sellerName} is SUPERADMIN`,
        });
        continue;
      }
      if (user.role === "ADMIN" && currentRole !== "SUPERADMIN") {
        results.skipped.push({
          id,
          reason: `Only SUPERADMIN can toggle ADMIN users`,
        });
        continue;
      }
      await prisma.user.update({ where: { id }, data: { isActive: activate } });
      invalidateUserCache(id);
      results.updated.push(user.sellerName);
    } catch (e: any) {
      results.skipped.push({ id, reason: e?.message || "Unknown error" });
    }
  }
  if (results.updated.length > 0) {
    const action = activate ? "Activated" : "Deactivated";
    await logAudit(
      "User Management",
      `Bulk ${action} Users`,
      `${results.updated.length} user(s) ${action.toLowerCase()}: ${results.updated.join(", ")}`,
    );
    revalidatePath("/users");
  }
  return { updated: results.updated.length, skipped: results.skipped };
}

export async function bulkDeleteUsers(ids: number[]) {
  await requireAdmin();
  const session = await auth();
  const currentRole = (session?.user as any)?.role;
  const results: {
    toggled: string[];
    skipped: { id: number; reason: string }[];
  } = { toggled: [], skipped: [] };
  for (const id of ids) {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        results.skipped.push({ id, reason: "Not found" });
        continue;
      }
      if (user.role === "SUPERADMIN") {
        results.skipped.push({
          id,
          reason: `${user.sellerName} is SUPERADMIN`,
        });
        continue;
      }
      if (user.role === "ADMIN" && currentRole !== "SUPERADMIN") {
        results.skipped.push({
          id,
          reason: "Only SUPERADMIN can deactivate ADMIN users",
        });
        continue;
      }
      await prisma.user.update({ where: { id }, data: { isActive: false } });
      invalidateUserCache(id);
      results.toggled.push(user.sellerName);
    } catch (e: any) {
      results.skipped.push({ id, reason: e?.message || "Unknown error" });
    }
  }
  if (results.toggled.length > 0) {
    await logAudit(
      "User Management",
      "Bulk Deactivate Users",
      `${results.toggled.length} user(s) deactivated: ${results.toggled.join(", ")}`,
    );
    revalidatePath("/users");
  }
  return { deactivated: results.toggled.length, skipped: results.skipped };
}
