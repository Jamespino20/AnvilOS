/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 12, 2026
*/

import { getUsers } from "@/actions";
import { auth } from "@/lib/auth";
import { UsersClient } from "./client";

export default async function UsersPage() {
  const session = await auth();
  const { users } = await getUsers({ perPage: 9999 });
  return <UsersClient users={users as any} currentUserRole={(session?.user as any)?.role as string} />;
}
