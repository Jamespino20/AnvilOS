import { TableSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-48 bg-[#e2e8f0] rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-[#e2e8f0] rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-[#e2e8f0] rounded-lg animate-pulse" />
      </div>
      <TableSkeleton rows={8} cols={6} />
    </div>
  );
}




