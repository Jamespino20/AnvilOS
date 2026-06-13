/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = Number(session.user.id);
  let unreadCount = 0;
  try {
    const totalNotifs = await prisma.notification.count();
    const readNotifs = await prisma.notificationRead.count({
      where: { userId },
    });
    unreadCount = totalNotifs - readNotifs;
  } catch {
    unreadCount = 0;
  }

  return (
    <DashboardShell user={session.user} unreadCount={unreadCount}>
      {children}
    </DashboardShell>
  );
}
