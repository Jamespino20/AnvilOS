/*
App Name: AnvilOS
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: 
*/

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username, answers } = await req.json();
    const user = await prisma.user.findUnique({ where: { sellerName: username } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const match =
      answers[0]?.toLowerCase() === user.securityAnswer1.toLowerCase() &&
      answers[1]?.toLowerCase() === user.securityAnswer2.toLowerCase() &&
      answers[2]?.toLowerCase() === user.securityAnswer3.toLowerCase();

    if (!match) {
      return NextResponse.json({ error: "Incorrect answers" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
