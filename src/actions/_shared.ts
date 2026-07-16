/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 16, 2026
*/

"use server";

import { Prisma } from "@prisma/client";
import { prisma, invalidateUserCache } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { logAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { withTimeout } from "@/lib/timeout";
import { IMPORT_CONFIGS } from "@/lib/import-configs";
import { actionFingerprint } from "@/lib/access";
import {
  requireAdmin,
  requireSuperAdmin,
  requireUser,
} from "@/lib/server-access";
import { formatMoney } from "@/lib/format";
import { createTotpSecret, verifyTotp } from "@/lib/totp";
import { cache } from "react";

const DB_TIMEOUT = 20000;

async function safeCall<T>(
  fn: () => Promise<T>,
  mapError?: (e: any) => string | undefined,
): Promise<T | { error: string }> {
  try {
    return await fn();
  } catch (e: any) {
    if (mapError) {
      const mapped = mapError(e);
      if (mapped) return { error: mapped };
    }
    return { error: e?.message || "An unexpected error occurred" };
  }
}

export {
  Prisma,
  prisma,
  invalidateUserCache,
  revalidatePath,
  revalidateTag,
  logAudit,
  auth,
  withTimeout,
  IMPORT_CONFIGS,
  actionFingerprint,
  requireAdmin,
  requireSuperAdmin,
  requireUser,
  formatMoney,
  createTotpSecret,
  verifyTotp,
  cache,
  DB_TIMEOUT,
  safeCall,
};
