import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { sellerName, username, email, password, passwordHash: clientHash, securityQ1, securityA1, securityQ2, securityA2, securityQ3, securityA3 } = await req.json();

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const existingByUsername = await prisma.user.findUnique({ where: { username } });
    if (existingByUsername) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const existingByEmail = email ? await prisma.user.findFirst({ where: { email } }) : null;
    if (existingByEmail) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const passwordHash = clientHash || await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        sellerName: sellerName || username,
        username,
        email: email || null,
        passwordHash,
        registryDate: new Date(),
        lastLogin: new Date(),
        isActive: true,
        securityQuestion1: securityQ1 || "What is your factory location?",
        securityAnswer1: securityA1 || "",
        securityQuestion2: securityQ2 || "What was your first tool?",
        securityAnswer2: securityA2 || "",
        securityQuestion3: securityQ3 || "Who is your main supplier?",
        securityAnswer3: securityA3 || "",
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
