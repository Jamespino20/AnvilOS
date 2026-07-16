/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 11, 2026
*/

import { markNotificationRead } from "@/actions";
import { requireUser } from "@/lib/server-access";
import { NextResponse } from "next/server";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireUser();
  const { id } = await params;
  await markNotificationRead(Number(session.user.id), Number(id));
  return NextResponse.json({ success: true });
}
