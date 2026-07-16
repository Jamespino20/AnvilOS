/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 16, 2026
*/

"use server";

import {
  prisma,
  revalidatePath,
  revalidateTag,
  logAudit,
  withTimeout,
  requireAdmin,
  requireUser,
  cache,
  DB_TIMEOUT,
  safeCall,
} from "./_shared";

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
  return safeCall(async () => {
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
    revalidatePath("/pos");
    revalidateTag("products", "default");
    revalidateTag("categories", "default");
    revalidateTag("brands", "default");
    return product;
  });
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
  return safeCall(async () => {
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
        ? await resolveProductSupplier(
            data.supplierId ?? null,
            data.supplierName,
          )
        : {
            supplierId: current.supplierId,
            supplierName: current.supplierName,
          };

    await assertUniqueProductName(
      productName,
      category.categoryId,
      brandId,
      id,
    );

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
    revalidatePath("/pos");
    revalidateTag("products", "default");
    revalidateTag("categories", "default");
    revalidateTag("brands", "default");
    return product;
  });
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
  revalidatePath("/pos");
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
  revalidatePath("/pos");
  revalidateTag("products", "default");
  return updated;
}

export async function deleteProduct(id: number) {
  return safeCall(async () => {
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
    revalidatePath("/pos");
    revalidateTag("products", "default");
  });
}

export async function deleteProducts(ids: number[]) {
  return safeCall(async () => {
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
    revalidatePath("/pos");
    revalidateTag("products", "default");
    return {
      deleted: result.count,
      skipped: ids.length - result.count,
      names: products.map((p) => p.productName),
    };
  });
}
