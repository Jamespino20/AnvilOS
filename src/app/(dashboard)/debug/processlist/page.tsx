/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { isSuperAdminRole } from "@/lib/access";
import ProcessListClient from "./client";

export const dynamic = "force-dynamic";

export default async function ProcessListPage() {
  const session = await auth();
  if (!session?.user || !isSuperAdminRole((session.user as any).role)) {
    redirect("/dashboard");
  }

  const rows = await prisma.$queryRawUnsafe(
    "SHOW PROCESSLIST",
  ) as any[];

  const processes = rows.map((r: any) => ({
    Id: Number(r.Id),
    User: r.User,
    Host: r.Host,
    db: r.db,
    Command: r.Command,
    Time: Number(r.Time),
    State: r.State,
    Info: r.Info,
  }));

  return <ProcessListClient initial={processes} />;
}
