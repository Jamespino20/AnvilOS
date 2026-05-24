/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 24, 2026
*/

import { prisma } from "./prisma";
import { auth } from "./auth";

type AuditPanel =
  | "POSPanel"
  | "InventoryPanel"
  | "Inventory"
  | "SupplierPanel"
  | "ProductDialog"
  | "EditTransactionDialog"
  | "Settings"
  | "Buyers"
  | "Restocks"
  | "Data Import"
  | "Dashboard"
  | "System";
type AuditAction = string;

export async function logAudit(
  panel: AuditPanel,
  action: AuditAction,
  details: string,
  successStatus: boolean = true,
  sellerIdOverride?: number,
) {
  try {
    const session = await auth();
    const sellerId = sellerIdOverride ?? (Number(session?.user?.id) || 0);

    await prisma.auditLog.create({
      data: {
        sellerId,
        panel,
        action,
        details,
        successStatus,
        logTime: new Date(),
      },
    });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}
