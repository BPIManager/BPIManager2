import { DashCard } from "@/components/ui/chakra/dashcard";
import { Skeleton } from "@/components/ui/skeleton";

export const ActivityCalendarSkeleton = () => {
  return (
    <DashCard className="p-5">
      <Skeleton className="mb-4 h-4 w-24" />

      <div className="flex items-start gap-2">
        <div
          className="grid gap-[3px]"
          style={{
            gridTemplateRows: "repeat(7, 11px)",
            marginTop: "2px",
          }}
        >
          <div className="h-[11px]" />
          <Skeleton className="h-[11px] w-6" />
          <div className="h-[11px]" />
          <Skeleton className="h-[11px] w-6" />
          <div className="h-[11px]" />
          <Skeleton className="h-[11px] w-6" />
          <div className="h-[11px]" />
        </div>
        <Skeleton className="h-[95px] flex-1 rounded-sm" />
      </div>

      <div className="mt-3 flex justify-end gap-1">
        <Skeleton className="h-3 w-20" />
      </div>
    </DashCard>
  );
};
