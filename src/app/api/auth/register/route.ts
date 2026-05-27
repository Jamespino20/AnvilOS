import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { issueEmailToken } from "@/lib/email-token";
import { sendMail } from "@/lib/mail";
import { checkRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";
import { sanitizeString, sanitizeEmail, sanitizePassword, validateBody, safeJsonParse, ValidationError } from "@/lib/sanitize";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(`register:${ip}`, 5, 15);

    const raw = await req.text();
    const body = safeJsonParse(raw);
    validateBody(req, body, ["password", "email"]);

    const email = sanitizeEmail(body.email);
    const password = sanitizePassword(body.password);
    const username = sanitizeString(body.username, 50);
    const sellerName = sanitizeString(body.sellerName || username, 100);

    const existingByUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingByUsername) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 },
      );
    }

    const existingByEmail = await prisma.user.findFirst({ where: { email } });
    if (existingByEmail) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        sellerName: sellerName || username,
        username,
        email,
        passwordHash,
        role: "STAFF",
        registryDate: new Date(),
        lastLogin: new Date(),
        isActive: false,
      },
    });

    const issued = await issueEmailToken(user.id, "EmailVerification", 60);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const verifyUrl = `${appUrl}/register?verifyToken=${issued.token}`;
    await sendMail({
      to: email,
      subject: "Verify your CWL Hardware account",
      html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto">
        <h1 style="color:#0e212c;font-size:20px">Verify your account</h1>
        <p style="color:#334155;font-size:14px">Use this code to activate your CWL Hardware account:</p>
        <p style="font-size:28px;letter-spacing:6px;font-weight:700;color:#fd761a">${issued.code}</p>
        <p style="color:#334155;font-size:14px">Then open this secure link:</p>
        <p><a href="${verifyUrl}" style="color:#fd761a">${verifyUrl}</a></p>
        <p style="color:#64748b;font-size:12px">This verification expires in 60 minutes.</p>
      </div>`,
    });

    await prisma.auditLog.create({
      data: {
        sellerId: null,
        successStatus: true,
        panel: "Register",
        action: "User Registration",
        details: `New staff user registered pending email verification: ${username}`,
      },
    });

    return NextResponse.json({ success: true, verifyToken: issued.token });
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
