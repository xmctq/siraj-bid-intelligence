import { HeaderSkeleton, ListSkeleton } from "@/components/status/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function TenderLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading tender">
      <HeaderSkeleton />
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="flex gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-20" />
        ))}
      </div>
      <ListSkeleton rows={4} />
    </div>
  );
}
