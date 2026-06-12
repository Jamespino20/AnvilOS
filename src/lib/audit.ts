/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 12, 2026
*/

import { prisma } from "./prisma";
import { auth } from "./auth";
import { actionFingerprint } from "@/lib/access";

type AuditPanel =
  | "POSPanel"
  | "InventoryPanel"
  | "Inventory"
  | "SupplierPanel"
  | "ProductDialog"
  | "EditTransactionDialog"
  | "Transactions"
  | "Settings"
  | "Buyers"
  | "Restocks"
  | "Data Import"
  | "Dashboard"
  | "System"
  | "User Management";
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
    const fingerprint = sellerId
      ? actionFingerprint(session)
      : `System [SYSTEM #${sellerIdOverride ?? "auto"}]`;

    await prisma.auditLog.create({
      data: {
        sellerId: sellerId || null,
        panel,
        action,
        details: `${details} | Actor: ${fingerprint}`,
        successStatus,
        logTime: new Date(),
      },
    });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}
