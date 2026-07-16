/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 11, 2026
*/

import { getUsers } from "@/actions";
import { auth } from "@/lib/auth";
import { UsersClient } from "./client";

export default async function UsersPage() {
  const session = await auth();
  let users: any[] = [];
  try {
    const result = await getUsers({ perPage: 9999 });
    users = result.users as any[];
  } catch {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-[#0e212c]">
            Database Unavailable
          </p>
          <p className="text-sm text-[#94a3b8]">
            Please try again in a few moments.
          </p>
        </div>
      </div>
    );
  }
  return (
    <UsersClient
      users={users as any}
      currentUserRole={(session?.user as any)?.role as string}
    />
  );
}
