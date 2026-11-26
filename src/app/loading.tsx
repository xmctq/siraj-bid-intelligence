import { HeaderSkeleton, KpiRowSkeleton, ListSkeleton } from "@/components/status/skeletons";

export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <HeaderSkeleton />
      <KpiRowSkeleton />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ListSkeleton rows={4} />
        </div>
        <ListSkeleton rows={4} />
      </div>
    </div>
  );
}
