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
  requireAdmin,
  cache,
  safeCall,
} from "./_shared";

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
  return safeCall(async () => {
    await requireAdmin();
    const s = await prisma.supplier.create({
      data: { ...data, isAvailable: true },
    });
    await logAudit(
      "SupplierPanel",
      "Add Supplier",
      `${s.supplierName} created`,
    );
    return s;
  });
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
  return safeCall(async () => {
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
  });
}

export async function deleteSupplier(id: number) {
  return safeCall(async () => {
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
  });
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
