/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 26, 2026
*/

import { getNotifications } from "@/actions";
import { requireUser } from "@/lib/server-access";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await requireUser();
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const notifications = await getNotifications(
    Number(session.user.id),
    page,
    limit,
  );
  return NextResponse.json(notifications);
}
