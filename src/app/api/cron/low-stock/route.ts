/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 16, 2026
*/

import { NextResponse } from "next/server";
import { processLowStockAlerts } from "@/actions/email";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processLowStockAlerts();

    // Cleanup: delete notifications older than 30 days
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deleted = await prisma.notification.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    return NextResponse.json({ ...result, cleanedOldNotifications: deleted.count });
  } catch (err: any) {
    console.error("Low-stock cron failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
