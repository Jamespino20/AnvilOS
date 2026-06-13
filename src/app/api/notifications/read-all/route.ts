/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

import { markAllNotificationsRead } from "@/actions";
import { requireUser } from "@/lib/server-access";
import { NextResponse } from "next/server";

export async function PATCH() {
  const session = await requireUser();
  await markAllNotificationsRead(Number(session.user.id));
  return NextResponse.json({ success: true });
}
