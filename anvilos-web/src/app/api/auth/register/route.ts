import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { sellerName, username, email, passwordHash, securityQ1, securityA1, securityQ2, securityA2, securityQ3, securityA3 } = await req.json();

    const existing = await prisma.user.findFirst({
      where: { OR: [{ sellerName: username }, { username }] },
    });
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    await prisma.user.create({
      data: {
        sellerName: username,
        username,
        email: email || null,
        passwordHash,
        registryDate: new Date(),
        lastLogin: new Date(),
        isActive: true,
        securityQuestion1: securityQ1,
        securityAnswer1: securityA1,
        securityQuestion2: securityQ2,
        securityAnswer2: securityA2,
        securityQuestion3: securityQ3,
        securityAnswer3: securityA3,
      },
    });

    await prisma.auditLog.create({
      data: {
        sellerId: null,
        successStatus: true,
        panel: "Register",
        action: "User Registration",
        details: `New user registered: ${username}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
