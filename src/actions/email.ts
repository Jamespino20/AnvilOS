/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 7, 2026
*/

"use server";

import { auth } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { formatMoney } from "@/lib/format";

function getUserId(session: any) {
  return Number(session?.user?.id || session?.user?.sellerId || 0);
}

export async function getNotifPrefs() {
  const session = await auth();
  const userId = getUserId(session);
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      notifLowStock: true,
      notifDailySales: true,
      notifTransaction: true,
      email: true,
    },
  });
  return user;
}

export async function updateNotifPrefs(prefs: {
  notifLowStock?: boolean;
  notifDailySales?: boolean;
  notifTransaction?: boolean;
}) {
  const session = await auth();
  const userId = getUserId(session);
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(prefs.notifLowStock !== undefined && {
        notifLowStock: prefs.notifLowStock,
      }),
      ...(prefs.notifDailySales !== undefined && {
        notifDailySales: prefs.notifDailySales,
      }),
      ...(prefs.notifTransaction !== undefined && {
        notifTransaction: prefs.notifTransaction,
      }),
    },
  });
  await logAudit(
    "Settings",
    "Update Notification Preferences",
    `User #${userId}`,
  );
  revalidatePath("/settings");
  return user;
}

/** Send low-stock alert emails to all users who have opted in */
export async function sendLowStockAlerts(
  lowStockProducts: {
    productName: string;
    quantity: number;
    minThreshold: number;
  }[],
) {
  if (lowStockProducts.length === 0) return;

  const recipients = await prisma.user.findMany({
    where: { notifLowStock: true, email: { not: null } },
    select: { email: true },
  });
  const emails = recipients.map((r) => r.email).filter(Boolean) as string[];
  if (emails.length === 0) return;

  const productRows = lowStockProducts
    .map(
      (p) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${p.productName}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${p.quantity}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${p.minThreshold}</td></tr>`,
    )
    .join("");

  await sendMail({
    to: emails,
    subject: `Low Stock Alert - ${lowStockProducts.length} product${lowStockProducts.length > 1 ? "s" : ""} below threshold`,
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#fd761a;padding:24px;text-align:center;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">Low Stock Alert</h1>
      </div>
      <div style="padding:24px;background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 8px 8px">
        <p style="color:#0e212c;font-size:14px;margin:0 0 16px">The following products are below their minimum stock threshold:</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#f8fafc">
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0">Product</th>
            <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e2e8f0">Current Qty</th>
            <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e2e8f0">Min Threshold</th>
          </tr></thead>
          <tbody>${productRows}</tbody>
        </table>
        <p style="color:#94a3b8;font-size:12px;margin-top:16px"><a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/inventory" style="color:#fd761a">View Inventory →</a></p>
      </div>
    </div>`,
  });

  for (const p of lowStockProducts) {
    await prisma.notification.create({
      data: {
        systemNotification: "Low Stock Alert",
        message: `LOW STOCK: ${p.productName} quantity is ${p.quantity} (threshold: ${p.minThreshold})`,
      },
    });
  }

  await logAudit(
    "Inventory",
    "Low Stock Alert Sent",
    `${lowStockProducts.length} products`,
  );
}

/** Send a transaction receipt email to a buyer */
export async function sendTransactionReceipt(
  receiptNumber: number,
  buyerName: string,
  buyerEmail: string,
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[],
  grandTotal: number,
  actorFingerprint?: string,
) {
  const itemRows = items
    .map(
      (i) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${i.productName}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${i.quantity}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${formatMoney(i.unitPrice)}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${formatMoney(i.totalPrice)}</td></tr>`,
    )
    .join("");

  await sendMail({
    to: buyerEmail,
    subject: `Receipt #${receiptNumber} - CWL Hardware`,
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#0e212c;padding:24px;text-align:center;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">CWL Hardware</h1>
        <p style="color:#94a3b8;margin:4px 0 0;font-size:13px">Receipt #${receiptNumber}</p>
      </div>
      <div style="padding:24px;background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 8px 8px">
        <p style="color:#0e212c;font-size:14px;margin:0 0 4px">Thank you, <strong>${buyerName}</strong>!</p>
        <p style="color:#64748b;font-size:13px;margin:0 0 16px">Your purchase has been completed.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#f8fafc">
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0">Item</th>
            <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e2e8f0">Qty</th>
            <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e2e8f0">Price</th>
            <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e2e8f0">Total</th>
          </tr></thead>
          <tbody>${itemRows}</tbody>
          <tfoot><tr>
            <td colspan="3" style="padding:12px;text-align:right;font-weight:700;font-size:15px">Grand Total</td>
            <td style="padding:12px;text-align:right;font-weight:700;font-size:15px;color:#fd761a">${formatMoney(grandTotal)}</td>
          </tr></tfoot>
        </table>
        <p style="color:#94a3b8;font-size:12px;margin-top:16px">Processed by: ${actorFingerprint || "System [SYSTEM #auto]"}</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:8px">Need help? Contact us at <a href="mailto:${process.env.SMTP_USER || "support@cwlhardware.com"}" style="color:#fd761a">${process.env.SMTP_USER || "support@cwlhardware.com"}</a></p>
      </div>
    </div>`,
  });

  await prisma.notification.create({
    data: {
      systemNotification: "Receipt",
      message: `Receipt #${receiptNumber} sent to ${buyerName} (${buyerEmail})`,
    },
  });

  await logAudit(
    "POSPanel",
    "Receipt Email Sent",
    `#${receiptNumber} -> ${buyerEmail}`,
  );
}

/** Send daily sales summary to all users with dailySales enabled */
export async function sendDailySalesReport() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [sales, recipients] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        transactionDate: { gte: today, lt: tomorrow },
        transactionStatus: "Completed",
      },
      _sum: { grandTotal: true },
      _count: true,
    }),
    prisma.user.findMany({
      where: { notifDailySales: true, email: { not: null } },
      select: { email: true },
    }),
  ]);

  const emails = recipients.map((r) => r.email).filter(Boolean) as string[];
  if (emails.length === 0) return;

  const totalSales = Number(sales._sum.grandTotal || 0);
  const txnCount = sales._count;

  await sendMail({
    to: emails,
    subject: `Daily Sales Report - ${today.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}`,
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#0e212c;padding:24px;text-align:center;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">Daily Sales Report</h1>
        <p style="color:#94a3b8;margin:4px 0 0;font-size:13px">${today.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
      </div>
      <div style="padding:24px;background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 8px 8px">
        <div style="display:flex;gap:16px;margin-bottom:16px">
          <div style="flex:1;background:#f8fafc;border-radius:8px;padding:16px;text-align:center">
            <p style="color:#64748b;font-size:12px;margin:0 0 4px">Total Sales</p>
            <p style="color:#0e212c;font-size:24px;font-weight:700;margin:0">${formatMoney(totalSales)}</p>
          </div>
          <div style="flex:1;background:#f8fafc;border-radius:8px;padding:16px;text-align:center">
            <p style="color:#64748b;font-size:12px;margin:0 0 4px">Transactions</p>
            <p style="color:#0e212c;font-size:24px;font-weight:700;margin:0">${txnCount}</p>
          </div>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin:0"><a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard" style="color:#fd761a">View Full Dashboard →</a></p>
      </div>
    </div>`,
  });

  await logAudit(
    "Dashboard",
    "Daily Sales Report Sent",
    `${formatMoney(totalSales)} (${txnCount} txns)`,
  );
}

/** Send transaction alert emails to all staff who have opted in */
export async function sendSystemTransactionAlert(
  receiptNumber: number,
  buyerName: string,
  grandTotal: number,
  actorFingerprint?: string,
) {
  const recipients = await prisma.user.findMany({
    where: { notifTransaction: true, email: { not: null } },
    select: { email: true },
  });
  const emails = recipients.map((r) => r.email).filter(Boolean) as string[];
  if (emails.length === 0) return;

  await sendMail({
    to: emails,
    subject: `System Alert: Transaction #${receiptNumber} Completed`,
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#0e212c;padding:24px;text-align:center;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">Transaction Alert</h1>
      </div>
      <div style="padding:24px;background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 8px 8px">
        <p style="color:#0e212c;font-size:14px;margin:0 0 16px">A new transaction has been processed:</p>
        <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:16px">
          <table style="width:100%;font-size:13px">
            <tr><td style="color:#64748b;padding:4px 0">Receipt #</td><td style="color:#0e212c;font-weight:600;text-align:right">#${receiptNumber}</td></tr>
            <tr><td style="color:#64748b;padding:4px 0">Buyer</td><td style="color:#0e212c;font-weight:600;text-align:right">${buyerName}</td></tr>
            <tr><td style="color:#64748b;padding:4px 0">Total Amount</td><td style="color:#fd761a;font-weight:700;text-align:right">${formatMoney(grandTotal)}</td></tr>
          </table>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin:0 0 8px">Processed by: ${actorFingerprint || "System [SYSTEM #auto]"}</p>
        <p style="color:#94a3b8;font-size:12px;margin:0"><a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/transactions" style="color:#fd761a">View Transaction Details →</a></p>
      </div>
    </div>`,
  });

  await prisma.notification.create({
    data: {
      systemNotification: "Transaction Alert",
      message: `Transaction #${receiptNumber} completed - ${buyerName} - ${formatMoney(grandTotal)}`,
    },
  });

  await logAudit(
    "System",
    "Transaction Alert Sent",
    `#${receiptNumber} alert sent to ${emails.length} staff`,
  );
}

/** Check all products for low/out-of-stock and send alerts + create notifications */
export async function checkAndAlertLowStock() {
  const [lowStockProducts, outOfStockProducts] = await Promise.all([
    prisma.$queryRaw<
      { productName: string; quantity: number; minThreshold: number }[]
    >`
      SELECT "productName", "quantity", "minThreshold" 
      FROM "products" 
      WHERE "quantity" <= "minThreshold" AND "quantity" > 0 AND "isAvailable" = true
    `,
    prisma.$queryRaw<{ productName: string }[]>`
      SELECT "productName"
      FROM "products"
      WHERE "quantity" = 0 AND "isAvailable" = true
    `,
  ]);

  if (lowStockProducts.length > 0) {
    await sendLowStockAlerts(lowStockProducts);
  }

  for (const p of outOfStockProducts) {
    await prisma.notification.create({
      data: {
        systemNotification: "Out of Stock Alert",
        message: `OUT OF STOCK: ${p.productName} is no longer available`,
      },
    });
  }

  if (outOfStockProducts.length > 0) {
    await logAudit(
      "Inventory",
      "Out of Stock Alert",
      `${outOfStockProducts.length} product(s) out of stock`,
    );
  }
}
