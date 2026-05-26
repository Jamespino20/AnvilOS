/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 26, 2026
*/

import { NextResponse } from "next/server";
import { sendDailySalesReport } from "@/actions/email";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await sendDailySalesReport();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Daily sales cron failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
