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
  auth,
  requireAdmin,
  cache,
  safeCall,
} from "./_shared";

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
    tin: b.tin,
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
        tin: null,
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

export async function createBuyer(data: {
  name: string;
  address?: string;
  contact?: string;
  email?: string;
  tin?: string;
}) {
  return safeCall(async () => {
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
      tin: data.tin || null,
      sellerId: sellerId || undefined,
    },
  });
  await logAudit("Buyers", "Add Buyer", `${data.name} created`);
  revalidatePath("/buyers");
  revalidateTag("buyers", "default");
  return buyer;
  });
}

export async function updateBuyerInfo(
  buyerName: string,
  data: {
    buyerAddress?: string;
    buyerContact?: string;
    buyerEmail?: string;
    imageUrl?: string | null;
    tin?: string;
  },
) {
  return safeCall(async () => {
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
      ...(data.tin !== undefined && { tin: data.tin }),
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
        ...(data.tin !== undefined && { tin: data.tin }),
      },
    });
  }
  await logAudit(
    "Buyers",
    "Update Buyer Info",
    `${buyerName}: address/contact/email/tin/image updated`,
  );
  revalidatePath("/buyers");
  revalidateTag("buyers", "default");
  return txns;
  });
}
