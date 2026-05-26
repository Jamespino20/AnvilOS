/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 26, 2026
*/

import { issueEmailToken } from "@/lib/email-token";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();
    if (!identifier) {
      return NextResponse.json({ error: "Username or email is required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: identifier, mode: "insensitive" } },
          { email: { equals: identifier, mode: "insensitive" } },
        ],
      },
    });

    if (!user?.email) return NextResponse.json({ success: true });

    const issued = await issueEmailToken(user.id, "PasswordReset", 30);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const resetUrl = `${appUrl}/forgot-password?token=${issued.token}`;

    await sendMail({
      to: user.email,
      subject: "Reset your CWL Hardware password",
      html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto">
        <h1 style="color:#0e212c;font-size:20px">Password reset request</h1>
        <p style="color:#334155;font-size:14px">Use this code with the secure reset link:</p>
        <p style="font-size:28px;letter-spacing:6px;font-weight:700;color:#fd761a">${issued.code}</p>
        <p><a href="${resetUrl}" style="color:#fd761a">${resetUrl}</a></p>
        <p style="color:#64748b;font-size:12px">This reset expires in 30 minutes. Ignore this email if you did not request it.</p>
      </div>`,
    });

    await prisma.auditLog.create({
      data: {
        sellerId: user.id,
        successStatus: true,
        panel: "ForgotPassword",
        action: "Password Reset Requested",
        details: `Password reset email sent to user #${user.id}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json({ error: "Failed to request password reset" }, { status: 500 });
  }
}




