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

export async function GET() {
  const session = await requireUser();
  const notifications = await getNotifications(Number(session.user.id));
  return NextResponse.json(notifications);
}




