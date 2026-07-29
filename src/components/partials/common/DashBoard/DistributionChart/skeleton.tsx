import { DashCard } from "@/components/ui/dashcard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface BaseSkeletonProps {
  count?: number;
  hasButton?: boolean;
}

export const DistributionChartSkeleton = ({
  count = 9,
  hasButton = false,
}: BaseSkeletonProps) => {
  const heights = ["20%", "45%", "30%", "65%", "80%", "75%", "90%"];

  return (
    <DashCard>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-4 w-[140px]" />
        {hasButton && <Skeleton className="h-7 w-[100px] rounded-md" />}
      </div>

      <div className="flex items-end justify-between gap-1 px-1">
        {[...Array(count)].map((_, i) => (
          <div
            key={i}
            className="flex h-[180px] min-w-0 max-w-[60px] flex-1 flex-col items-stretch gap-0"
          >
            <div className="relative flex h-[150px] w-full flex-col items-center justify-end px-1 pb-[25px]">
              <Skeleton className="mb-1 h-[10px] w-[80%]" />
              <Skeleton
                className="w-full rounded-t-[2px]"
                style={{ height: heights[i % heights.length] }}
              />
            </div>

            <div className="h-[1px] w-full bg-bpim-overlay/60" />

            <div className="flex h-[30px] items-center justify-center">
              <Skeleton className="h-[10px] w-[70%]" />
            </div>
          </div>
        ))}
      </div>
    </DashCard>
  );
};
