import { consumeEmailToken } from "@/lib/email-token";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";
import { sanitizeString, validateBody, safeJsonParse, ValidationError } from "@/lib/sanitize";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(`verify-email:${ip}`, 5, 15);

    const raw = await req.text();
    const body = safeJsonParse(raw);
    validateBody(req, body, ["token", "code"]);

    const token = sanitizeString(body.token, 512);
    const code = sanitizeString(body.code, 10);

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
    if (error instanceof RateLimitError || error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    console.error("Email verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
