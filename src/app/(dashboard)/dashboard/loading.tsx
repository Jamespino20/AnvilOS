/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 11, 2026
*/

import { CardSkeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Loading..." />
      <CardSkeleton count={4} />
    </div>
  );
}
