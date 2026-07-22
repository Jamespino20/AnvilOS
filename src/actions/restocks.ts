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
  requireUser,
  safeCall,
} from "./_shared";

export async function processRestock(transactionId: number) {
  return safeCall(async () => {
  await requireUser();
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
  import("@/actions/email")
    .then((m) => m.checkAndAlertLowStock())
    .catch((e) => console.error("Low stock alert failed:", e));

  revalidatePath("/restocks");
  revalidatePath("/inventory");
  return txn;
  });
}
