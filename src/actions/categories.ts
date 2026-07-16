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
  return safeCall(
    async () => {
      await requireUser();
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
    },
    (e) =>
      e?.code === "P2002"
        ? `A category named "${name}" already exists in this parent.`
        : undefined,
  );
}

export async function editCategory(
  id: number,
  name: string,
  parentCategoryId?: number,
) {
  return safeCall(
    async () => {
      await requireUser();
      if (parentCategoryId && parentCategoryId === id) {
        return { error: "A category cannot be its own parent." };
      }
      if (parentCategoryId) {
        const descendants = await prisma.category.findMany({
          where: { parentCategoryId: id },
          select: { id: true },
        });
        const descendantIds = descendants.map((d) => d.id);
        if (descendantIds.includes(parentCategoryId)) {
          return { error: "Cannot assign a subcategory as its own parent." };
        }
      }
      const cat = await prisma.category.update({
        where: { id },
        data: {
          name,
          parentCategoryId:
            parentCategoryId !== undefined
              ? parentCategoryId || null
              : undefined,
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
    },
    (e) =>
      e?.code === "P2002"
        ? `A category named "${name}" already exists in this parent.`
        : undefined,
  );
}

export async function deleteCategory(id: number) {
  return safeCall(async () => {
    await requireAdmin();
    const children = await prisma.category.count({
      where: { parentCategoryId: id },
    });
    if (children > 0) {
      return {
        error: `Cannot delete category: it has ${children} subcategory(ies). Remove them first.`,
      };
    }
    const linked = await prisma.product.count({ where: { categoryId: id } });
    if (linked > 0) {
      return {
        error: `Cannot delete category: ${linked} product(s) are linked to it. Remove or reassign them first.`,
      };
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
  });
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
