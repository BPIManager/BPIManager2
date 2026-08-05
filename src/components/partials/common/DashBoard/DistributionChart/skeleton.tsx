import { DashCard } from "@/components/ui/dashcard";
import { Skeleton } from "@/components/ui/skeleton";

interface BaseSkeletonProps {
  count?: number;
  hasButton?: boolean;
}

const DistributionChartSkeleton = ({
  count = 9,
  hasButton = false,
}: BaseSkeletonProps) => {
  const heights = ["20%", "45%", "30%", "65%", "80%", "75%", "90%"];

  return (
    <DashCard>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-4 w-35" />
        {hasButton && <Skeleton className="h-7 w-25 rounded-md" />}
      </div>

      <div className="flex items-end justify-between gap-1 px-1">
        {[...Array(count)].map((_, i) => (
          <div
            key={i}
            className="flex h-45 min-w-0 max-w-15 flex-1 flex-col items-stretch gap-0"
          >
            <div className="relative flex h-37.5 w-full flex-col items-center justify-end px-1 pb-6.25">
              <Skeleton className="mb-1 h-2.5 w-[80%]" />
              <Skeleton
                className="w-full rounded-t-[2px]"
                style={{ height: heights[i % heights.length] }}
              />
            </div>

            <div className="h-px w-full bg-bpim-overlay/60" />

            <div className="flex h-7.5 items-center justify-center">
              <Skeleton className="h-2.5 w-[70%]" />
            </div>
          </div>
        ))}
      </div>
    </DashCard>
  );
};

export default DistributionChartSkeleton;
