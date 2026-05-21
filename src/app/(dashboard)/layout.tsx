import { auth } from "@/lib/auth";
import { DashboardSidebar } from "@/components/sidebar";
import { DashboardTopbar } from "@/components/topbar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0]">
      <DashboardSidebar />
      <div className="flex-1 ml-[260px] flex flex-col min-h-screen">
        <DashboardTopbar user={session.user} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
