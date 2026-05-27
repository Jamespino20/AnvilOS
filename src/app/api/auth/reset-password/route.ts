import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { consumeEmailToken } from "@/lib/email-token";
import { checkRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";
import { sanitizeString, sanitizePassword, validateBody, safeJsonParse, ValidationError } from "@/lib/sanitize";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(`reset-password:${ip}`, 5, 15);

    const raw = await req.text();
    const body = safeJsonParse(raw);
    validateBody(req, body, ["token", "code", "password"]);

    const token = sanitizeString(body.token, 512);
    const code = sanitizeString(body.code, 10);
    const password = sanitizePassword(body.password);

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
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 },
    );
  }
}
