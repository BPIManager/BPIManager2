import { Skeleton } from "@/components/ui/skeleton";

export function PatternTabSkeleton() {
  return (
    <div className="flex flex-col gap-3 mt-3">
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
