/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 24, 2026
*/

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextFetchEvent } from "next/server";
import type { NextAuthRequest } from "next-auth";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|register|forgot-password).*)",
  ],
};

export const proxy = auth((request: NextAuthRequest, event: NextFetchEvent) => {
  const accumulatedCookies = request.cookies
    .getAll()
    .filter((c) => /authjs\.session-token/.test(c.name));

  if (accumulatedCookies.length > 0) {
    const response = NextResponse.next();
    for (const { name } of accumulatedCookies) {
      response.headers.append(
        "Set-Cookie",
        `${name}=; Max-Age=0; Path=/; Secure; SameSite=Lax`
      );
    }
    return response;
  }
});
