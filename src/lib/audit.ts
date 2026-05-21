import { prisma } from "./prisma";
import { auth } from "./auth";

type AuditPanel = "POSPanel" | "InventoryPanel" | "SupplierPanel" | "ProductDialog" | "EditTransactionDialog" | "System";
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
      data: { sellerId, panel, action, details, successStatus, logTime: new Date() },
    });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}
