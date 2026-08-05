import { DashCard } from "@/components/ui/dashcard";
import { Skeleton } from "@/components/ui/skeleton";

const ActivityCalendarSkeleton = () => {
  return (
    <DashCard className="p-5">
      <Skeleton className="mb-4 h-4 w-24" />

      <div className="flex items-start gap-2">
        <div
          className="grid gap-0.75"
          style={{
            gridTemplateRows: "repeat(7, 11px)",
            marginTop: "2px",
          }}
        >
          <div className="h-2.75" />
          <Skeleton className="h-2.75 w-6" />
          <div className="h-2.75" />
          <Skeleton className="h-2.75 w-6" />
          <div className="h-2.75" />
          <Skeleton className="h-2.75 w-6" />
          <div className="h-2.75" />
        </div>
        <Skeleton className="h-23.75 flex-1 rounded-sm" />
      </div>

      <div className="mt-3 flex justify-end gap-1">
        <Skeleton className="h-3 w-20" />
      </div>
    </DashCard>
  );
};

export default ActivityCalendarSkeleton;
