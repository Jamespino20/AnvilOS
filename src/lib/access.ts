/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 26, 2026
*/

export type AppRole = "ADMIN" | "STAFF";

export const STAFF_PATHS = ["/dashboard", "/pos", "/categories", "/transactions", "/inventory"];

export function isAdminRole(role?: string | null) {
  return role === "ADMIN";
}

export function canAccessPath(role: string | null | undefined, pathname: string) {
  if (isAdminRole(role)) return true;
  return STAFF_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function actionFingerprint(session: any) {
  const user = session?.user;
  const id = user?.id || user?.sellerId || "unknown";
  const name = user?.name || user?.username || "Unknown";
  const role = user?.role || "UNKNOWN";
  return `${name} [${role} #${id}]`;
}




