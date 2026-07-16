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
  requireAdmin,
  auth,
  safeCall,
} from "./_shared";

// ─────────── User Management (Admin) ───────────

export async function getUsers(opts?: {
  search?: string;
  page?: number;
  perPage?: number;
}) {
  await requireAdmin();
  const where: any = {};
  if (opts?.search) {
    where.OR = [
      { sellerName: { contains: opts.search } },
      { username: { contains: opts.search } },
      { email: { contains: opts.search } },
    ];
  }
  const take = opts?.perPage || 20;
  const skip = ((opts?.page || 1) - 1) * take;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { sellerName: "asc" },
      select: {
        id: true,
        sellerName: true,
        username: true,
        email: true,
        imageUrl: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLogin: true,
        registryDate: true,
        _count: { select: { transactions: true } },
      },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);
  return {
    users,
    total,
    page: opts?.page || 1,
    totalPages: Math.ceil(total / take),
  };
}

export async function createUser(data: {
  sellerName: string;
  username: string;
  email: string;
  password: string;
  role: "SUPERADMIN" | "ADMIN" | "STAFF";
}) {
  return safeCall(async () => {
  await requireAdmin();
  const bcrypt = await import("bcryptjs");
  const exists = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: data.username } },
        { email: { equals: data.email } },
      ],
    },
  });
  if (exists) throw new Error("Username or email already exists");
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      sellerName: data.sellerName,
      username: data.username,
      email: data.email,
      passwordHash,
      role: data.role,
      isActive: true,
      registryDate: new Date(),
      lastLogin: new Date(),
    },
  });
  await logAudit(
    "User Management",
    "Create User",
    `Created user ${user.sellerName} (${data.role})`,
  );
  revalidatePath("/users");
  return { id: user.id };
  });
}

export async function updateUser(
  id: number,
  data: {
    sellerName?: string;
    username?: string;
    email?: string;
    role?: "SUPERADMIN" | "ADMIN" | "STAFF";
    isActive?: boolean;
    password?: string;
  },
) {
  return safeCall(async () => {
  await requireAdmin();
  const session = await auth();
  const currentRole = (session?.user as any)?.role;

  // Check if target user is ADMIN
  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) throw new Error("User not found");

  // Only SUPERADMIN can edit ADMIN users
  if (targetUser.role === "ADMIN" && currentRole !== "SUPERADMIN") {
    throw new Error("Only SUPERADMIN can edit ADMIN users");
  }

  // Only SUPERADMIN can edit SUPERADMIN users
  if (targetUser.role === "SUPERADMIN" && currentRole !== "SUPERADMIN") {
    throw new Error("Only SUPERADMIN can edit SUPERADMIN users");
  }

  // Only SUPERADMIN can promote to SUPERADMIN
  if (data.role === "SUPERADMIN" && currentRole !== "SUPERADMIN") {
    throw new Error("Only SUPERADMIN can promote to SUPERADMIN");
  }

  const updateData: any = {};
  if (data.sellerName !== undefined) updateData.sellerName = data.sellerName;
  if (data.username !== undefined) updateData.username = data.username;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.password) {
    const bcrypt = await import("bcryptjs");
    updateData.oldPasswordHash = null;
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }
  const user = await prisma.user.update({ where: { id }, data: updateData });
  invalidateUserCache(id);
  await logAudit(
    "User Management",
    "Update User",
    `Updated user ${user.sellerName} (id=${id})`,
  );
  revalidatePath("/users");
  return { id: user.id };
  });
}

export async function deleteUser(id: number) {
  return safeCall(async () => {
  await requireAdmin();
  const session = await auth();
  const currentRole = (session?.user as any)?.role;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");

  // Only SUPERADMIN can deactivate ADMIN users
  if (user.role === "ADMIN" && currentRole !== "SUPERADMIN") {
    throw new Error("Only SUPERADMIN can deactivate ADMIN users");
  }

  // Cannot deactivate SUPERADMIN
  if (user.role === "SUPERADMIN") {
    throw new Error("Cannot deactivate SUPERADMIN users");
  }
  await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });
  invalidateUserCache(id);
  const action = user.isActive ? "Deactivated" : "Activated";
  await logAudit(
    "User Management",
    `${action} User`,
    `${action} user ${user.sellerName} (id=${id})`,
  );
  revalidatePath("/users");
  return { success: true };
  });
}

export async function bulkToggleUsers(ids: number[], activate: boolean) {
  await requireAdmin();
  const session = await auth();
  const currentRole = (session?.user as any)?.role;
  const results: {
    updated: string[];
    skipped: { id: number; reason: string }[];
  } = { updated: [], skipped: [] };
  for (const id of ids) {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        results.skipped.push({ id, reason: "Not found" });
        continue;
      }
      if (user.role === "SUPERADMIN") {
        results.skipped.push({
          id,
          reason: `${user.sellerName} is SUPERADMIN`,
        });
        continue;
      }
      if (user.role === "ADMIN" && currentRole !== "SUPERADMIN") {
        results.skipped.push({
          id,
          reason: `Only SUPERADMIN can toggle ADMIN users`,
        });
        continue;
      }
      await prisma.user.update({ where: { id }, data: { isActive: activate } });
      invalidateUserCache(id);
      results.updated.push(user.sellerName);
    } catch (e: any) {
      results.skipped.push({ id, reason: e?.message || "Unknown error" });
    }
  }
  if (results.updated.length > 0) {
    const action = activate ? "Activated" : "Deactivated";
    await logAudit(
      "User Management",
      `Bulk ${action} Users`,
      `${results.updated.length} user(s) ${action.toLowerCase()}: ${results.updated.join(", ")}`,
    );
    revalidatePath("/users");
  }
  return { updated: results.updated.length, skipped: results.skipped };
}

export async function bulkDeleteUsers(ids: number[]) {
  await requireAdmin();
  const session = await auth();
  const currentRole = (session?.user as any)?.role;
  const results: {
    toggled: string[];
    skipped: { id: number; reason: string }[];
  } = { toggled: [], skipped: [] };
  for (const id of ids) {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        results.skipped.push({ id, reason: "Not found" });
        continue;
      }
      if (user.role === "SUPERADMIN") {
        results.skipped.push({
          id,
          reason: `${user.sellerName} is SUPERADMIN`,
        });
        continue;
      }
      if (user.role === "ADMIN" && currentRole !== "SUPERADMIN") {
        results.skipped.push({
          id,
          reason: "Only SUPERADMIN can deactivate ADMIN users",
        });
        continue;
      }
      await prisma.user.update({ where: { id }, data: { isActive: false } });
      invalidateUserCache(id);
      results.toggled.push(user.sellerName);
    } catch (e: any) {
      results.skipped.push({ id, reason: e?.message || "Unknown error" });
    }
  }
  if (results.toggled.length > 0) {
    await logAudit(
      "User Management",
      "Bulk Deactivate Users",
      `${results.toggled.length} user(s) deactivated: ${results.toggled.join(", ")}`,
    );
    revalidatePath("/users");
  }
  return { deactivated: results.toggled.length, skipped: results.skipped };
}
