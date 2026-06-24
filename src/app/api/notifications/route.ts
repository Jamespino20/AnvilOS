/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

import { getNotifications, deleteNotification } from "@/actions";
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

export async function DELETE(req: Request) {
  const session = await requireUser();
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing notification id" }, { status: 400 });
  await deleteNotification(id);
  return NextResponse.json({ success: true });
}
