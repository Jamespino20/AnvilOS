/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 26, 2026
*/

import { consumeEmailToken } from "@/lib/email-token";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { token, code } = await req.json();
    if (!token || !code) {
      return NextResponse.json({ error: "Token and code are required" }, { status: 400 });
    }

    const record = await consumeEmailToken("EmailVerification", token, code);
    if (!record) {
      return NextResponse.json({ error: "Invalid or expired verification" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date(), isActive: true },
    });

    await prisma.auditLog.create({
      data: {
        sellerId: record.userId,
        successStatus: true,
        panel: "Register",
        action: "Email Verified",
        details: `Account email verified for user #${record.userId}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}




