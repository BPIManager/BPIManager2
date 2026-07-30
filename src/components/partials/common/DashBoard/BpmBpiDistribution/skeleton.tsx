import { DashCard } from "@/components/ui/dashcard";
import { Skeleton } from "@/components/ui/skeleton";
import { BPM_CONST } from "@/constants/iidx/bpmBands";

export const BpmBpiSkeleton = () => (
  <DashCard>
    <div className="mb-6 flex items-center justify-between">
      <Skeleton className="h-4 w-40" />
    </div>
    <div className="flex flex-col gap-3">
      {BPM_CONST.BPM_BAND_ORDER.map((label) => (
        <div key={label} className="flex items-center gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-2.5 flex-1" />
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  </DashCard>
);
