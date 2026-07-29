import { Skeleton } from "@/components/ui/skeleton";

export function SimilarTabSkeleton() {
  return (
    <div className="flex flex-col gap-2 mt-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-lg" />
      ))}
    </div>
  );
}
