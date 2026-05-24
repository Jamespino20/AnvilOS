/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 24, 2026
*/

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cookiesToClear = request.cookies
    .getAll()
    .filter((c) => /authjs\.session-token/.test(c.name));

  if (cookiesToClear.length === 0) {
    return NextResponse.json({ cleared: 0 });
  }

  const response = NextResponse.json({ cleared: cookiesToClear.length });
  for (const { name } of cookiesToClear) {
    response.headers.append(
      "Set-Cookie",
      `${name}=; Max-Age=0; Path=/; Secure; SameSite=Lax`
    );
  }
  return response;
}
