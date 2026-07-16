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
  requireUser,
  cache,
  safeCall,
} from "./_shared";

export const getBrands = cache(async () => {
  return prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
});

export async function createBrand(name: string) {
  return safeCall(
    async () => {
      await requireUser();
      const brand = await prisma.brand.create({
        data: { name, createdAt: new Date() },
      });
      await logAudit("InventoryPanel", "Add Brand", `${brand.name} created`);
      revalidatePath("/inventory");
      revalidatePath("/brands");
      revalidateTag("brands", "default");
      return brand;
    },
    (e) =>
      e?.code === "P2002"
        ? `A brand named "${name}" already exists.`
        : undefined,
  );
}

export async function editBrand(id: number, name: string) {
  return safeCall(
    async () => {
      await requireUser();
      const brand = await prisma.brand.update({
        where: { id },
        data: { name },
      });
      await logAudit(
        "InventoryPanel",
        "Edit Brand",
        `Brand #${id} renamed to "${name}"`,
      );
      revalidatePath("/inventory");
      revalidatePath("/brands");
      revalidateTag("brands", "default");
      return brand;
    },
    (e) =>
      e?.code === "P2002"
        ? `A brand named "${name}" already exists.`
        : undefined,
  );
}

export async function deleteBrand(id: number) {
  return safeCall(async () => {
    await requireAdmin();
    const linked = await prisma.product.count({ where: { brandId: id } });
    if (linked > 0) {
      return {
        error: `Cannot delete brand: ${linked} product(s) are linked to it.`,
      };
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
  });
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
