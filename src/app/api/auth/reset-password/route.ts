/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 26, 2026
*/

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { consumeEmailToken } from "@/lib/email-token";

export async function POST(req: Request) {
  try {
    const { token, code, password } = await req.json();
    if (!token || !code || !password) {
      return NextResponse.json(
        { error: "Token, code, and password are required" },
        { status: 400 },
      );
    }

    const record = await consumeEmailToken("PasswordReset", token, code);
    if (!record) {
      return NextResponse.json(
        { error: "Invalid or expired reset" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: record.userId },
    });
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { oldPasswordHash: user.passwordHash, passwordHash },
    });

    await prisma.auditLog.create({
      data: {
        sellerId: user.id,
        successStatus: true,
        panel: "ForgotPassword",
        action: "Password Reset",
        details: `Password reset via email token for user: ${user.username}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 },
    );
  }
}
