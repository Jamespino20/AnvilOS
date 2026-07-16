/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 16, 2026
*/

"use server";

import {
  prisma,
  invalidateUserCache,
  revalidatePath,
  logAudit,
  auth,
  requireUser,
  createTotpSecret,
  verifyTotp,
  safeCall,
} from "./_shared";

export async function updateProfile(data: { name: string; imageUrl?: string }) {
  return safeCall(async () => {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const updateData: any = { sellerName: data.name };
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  const user = await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: updateData,
  });
  invalidateUserCache(Number(session.user.id));
  await logAudit("Settings", "Update Profile", `Name changed to ${data.name}`);
  revalidatePath("/settings");
  return user;
  });
}

export async function updatePassword(newPassword: string) {
  return safeCall(async () => {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const bcrypt = await import("bcryptjs");
  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { id: Number(session.user.id) },
  });
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const user = await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: {
      oldPasswordHash: currentUser.passwordHash,
      passwordHash,
    },
  });
  invalidateUserCache(Number(session.user.id));
  await logAudit("Settings", "Change Password", "Password changed");
  revalidatePath("/settings");
  return user;
  });
}

export async function startTotpSetup() {
  const session = await requireUser();
  const userId = Number((session.user as any).id);
  const secret = createTotpSecret();
  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: secret, totpEnabled: false },
  });
  invalidateUserCache(userId);
  await logAudit("Settings", "Start TOTP Setup", "Authenticator setup started");
  return { secret };
}

export async function confirmTotpSetup(code: string) {
  return safeCall(async () => {
  const session = await requireUser();
  const userId = Number((session.user as any).id);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { totpSecret: true },
  });
  if (!user.totpSecret || !verifyTotp(user.totpSecret, code)) {
    throw new Error("Invalid authenticator code");
  }
  await prisma.user.update({
    where: { id: userId },
    data: { totpEnabled: true },
  });
  invalidateUserCache(userId);
  await logAudit("Settings", "Enable TOTP", "Authenticator app enabled");
  return { success: true };
  });
}

export async function disableTotp() {
  const session = await requireUser();
  const userId = Number((session.user as any).id);
  await prisma.user.update({
    where: { id: userId },
    data: { totpEnabled: false, totpSecret: null },
  });
  invalidateUserCache(userId);
  await logAudit("Settings", "Disable TOTP", "Authenticator app disabled");
  return { success: true };
}
