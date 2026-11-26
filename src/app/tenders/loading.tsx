import { HeaderSkeleton, ListSkeleton } from "@/components/status/skeletons";

export default function TendersLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading tenders">
      <HeaderSkeleton />
      <ListSkeleton rows={6} />
    </div>
  );
}
