/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 7, 2026
*/

import { createHash, randomBytes, randomInt } from "crypto";
import bcrypt from "bcryptjs";
import type { EmailTokenPurpose } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createPlainToken() {
  return randomBytes(32).toString("hex");
}

export function createEmailCode() {
  return String(randomInt(100000, 1000000));
}

export async function issueEmailToken(
  userId: number,
  purpose: EmailTokenPurpose,
  minutes = 30,
) {
  const token = createPlainToken();
  const code = createEmailCode();
  const expiresAt = new Date(Date.now() + minutes * 60_000);

  await prisma.emailToken.create({
    data: {
      userId,
      purpose,
      tokenHash: hashToken(token),
      codeHash: await bcrypt.hash(code, 10),
      expiresAt,
    },
  });

  return { token, code, expiresAt };
}

export async function consumeEmailToken(
  purpose: EmailTokenPurpose,
  token: string,
  code: string,
) {
  const record = await prisma.emailToken.findFirst({
    where: {
      purpose,
      tokenHash: hashToken(token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return null;

  const validCode = await bcrypt.compare(code, record.codeHash);
  if (!validCode) return null;

  await prisma.emailToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });
  return record;
}
