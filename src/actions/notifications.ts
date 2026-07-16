/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 16, 2026
*/

"use server";

import { prisma, revalidatePath, logAudit, requireAdmin } from "./_shared";

// ─────────── Notifications ───────────

export async function getNotifications(
  userId: number,
  page: number = 1,
  limit: number = 10,
) {
  const skip = (page - 1) * limit;
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });
  const readIds = await prisma.notificationRead.findMany({
    where: { userId, notificationId: { in: notifications.map((n) => n.id) } },
    select: { notificationId: true },
  });
  const readSet = new Set(
    readIds.map((r: { notificationId: any }) => r.notificationId),
  );
  return notifications.map((n) => ({ ...n, isRead: readSet.has(n.id) }));
}

export async function markNotificationRead(userId: number, id: number) {
  await prisma.notificationRead.upsert({
    where: { notificationId_userId: { notificationId: id, userId } },
    create: { notificationId: id, userId },
    update: {},
  });
  await logAudit(
    "System",
    "Mark Notification Read",
    `Notification ${id} marked as read by user ${userId}`,
  );
}

export async function markAllNotificationsRead(userId: number) {
  const allNotifs = await prisma.notification.findMany({
    select: { id: true },
  });
  const existing = await prisma.notificationRead.findMany({
    where: { userId },
    select: { notificationId: true },
  });
  const existingIds = new Set(
    existing.map((r: { notificationId: any }) => r.notificationId),
  );
  const toCreate = allNotifs
    .filter((n) => !existingIds.has(n.id))
    .map((n) => ({ notificationId: n.id, userId }));
  if (toCreate.length > 0) {
    await prisma.notificationRead.createMany({ data: toCreate });
  }
  await logAudit(
    "System",
    "Mark All Read",
    `All notifications marked as read by user ${userId}`,
  );
  revalidatePath("/notifications");
}

export async function deleteNotification(id: number) {
  await requireAdmin();
  await prisma.notification.delete({ where: { id } });
  await logAudit(
    "System",
    "Delete Notification",
    `Notification #${id} deleted`,
  );
  revalidatePath("/notifications");
}

export async function getUnreadNotificationCount(userId: number) {
  const total = await prisma.notification.count();
  const read = await prisma.notificationRead.count({ where: { userId } });
  return total - read;
}
