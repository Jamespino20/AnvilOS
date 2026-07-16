/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 16, 2026
*/

"use server";

import { prisma, revalidatePath, logAudit, auth } from "./_shared";

// ─────────── Custom Downloadables ───────────

export async function getCustomDownloadables() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return prisma.customDownloadable.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      fileName: true,
      fileType: true,
      fileSize: true,
      createdAt: true,
      uploadedBy: true,
    },
  });
}

export async function createCustomDownloadable(data: {
  name: string;
  description?: string;
  fileName: string;
  fileData: string;
  fileType: string;
  fileSize: number;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = Number(session.user.id);
  const item = await prisma.customDownloadable.create({
    data: {
      name: data.name,
      description: data.description || null,
      fileName: data.fileName,
      fileData: data.fileData,
      fileType: data.fileType,
      fileSize: data.fileSize,
      uploadedBy: userId || undefined,
    },
  });
  await logAudit(
    "Downloadables",
    "Add File",
    `${data.name} (${data.fileName}) uploaded`,
  );
  revalidatePath("/downloadables");
  return item;
}

export async function deleteCustomDownloadable(id: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const item = await prisma.customDownloadable.findUniqueOrThrow({
    where: { id },
  });
  await prisma.customDownloadable.delete({ where: { id } });
  await logAudit("Downloadables", "Delete File", `${item.name} deleted`);
  revalidatePath("/downloadables");
}

export async function getCustomDownloadableData(id: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const item = await prisma.customDownloadable.findUniqueOrThrow({
    where: { id },
    select: { fileData: true, fileName: true, fileType: true },
  });
  return item;
}
