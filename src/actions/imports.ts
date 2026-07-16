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
  logAudit,
  requireAdmin,
  auth,
  IMPORT_CONFIGS,
  safeCall,
} from "./_shared";

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
  return safeCall(async () => {
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
  });
}
