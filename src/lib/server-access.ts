/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/access";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (!isAdminRole((session.user as any).role)) throw new Error("Forbidden");
  return session;
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session as {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: string | null;
      imageUrl?: string | null;
    };
  };
}
