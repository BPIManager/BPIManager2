import { DistributionChartSkeleton } from "@/components/partials/DashBoard/DistributionChart/skeleton";
import { DashCard } from "@/components/ui/dashcard";
import { cn } from "@/lib/utils";

const animationStyles = `
  @keyframes bounceGrow {
    0% { transform: scaleY(0); }
    60% { transform: scaleY(1.1); }
    80% { transform: scaleY(0.95); }
    100% { transform: scaleY(1); }
  }
`;

export interface ChartData {
  label: string;
  count: number;
}

interface DistributionChartProps {
  title: string;
  myData: ChartData[];
  rivalData?: ChartData[];
  isLoading: boolean;
  getColor: (label: string) => string;
  myName?: string;
  rivalName?: string;
  skeletonCount?: number;
}

const ChartBarUnit = ({
  label,
  myCount,
  rivalCount,
  maxCount,
  color,
  index,
}: {
  label: string;
  myCount: number;
  rivalCount?: number;
  maxCount: number;
  color: string;
  index: number;
}) => {
  const hasRival = rivalCount !== undefined;
  const myHeight = `${(myCount / maxCount) * 100}%`;
  const rivalHeight = hasRival ? `${(rivalCount / maxCount) * 100}%` : "0%";

  return (
    <div className="flex h-[180px] min-w-0 max-w-[60px] flex-1 flex-col items-stretch gap-0">
      <div className="relative h-[150px] w-full">
        <div
          className={cn(
            "absolute bottom-[25px] left-0 right-0 flex h-[100px] items-end justify-center",
            hasRival ? "gap-[2px]" : "gap-0",
          )}
        >
          <div className="relative flex h-full flex-1 min-w-0 flex-col justify-end">
            <span
              className={cn(
                "whitespace-nowrap text-[10px] font-bold text-blue-400",
                myCount > 0 ? "visible" : "hidden",
                hasRival
                  ? "absolute bottom-[calc(100%+2px)] left-1/2 -translate-x-1/2"
                  : "relative mb-[2px] w-full text-center",
              )}
            >
              {myCount}
            </span>
            <div
              className="w-full origin-bottom rounded-t-[2px] border-t-2 border-blue-400 opacity-90 animate-[bounceGrow_0.6s_ease-out_both]"
              style={{
                height: myHeight,
                backgroundColor: color,
                animationDelay: `${index * 0.04}s`,
              }}
            />
          </div>

          {hasRival && (
            <div className="relative flex h-full flex-1 min-w-0 flex-col justify-end">
              <div
                className="w-full origin-bottom rounded-t-[2px] border-t-2 border-orange-400 opacity-45 animate-[bounceGrow_0.6s_ease-out_both]"
                style={{
                  height: rivalHeight,
                  backgroundColor: color,
                  animationDelay: `${index * 0.04 + 0.02}s`,
                }}
              />
            </div>
          )}
        </div>

        {hasRival && (
          <span
            className={cn(
              "absolute bottom-[5px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-orange-400",
              rivalCount > 0 ? "visible" : "hidden",
            )}
          >
            {rivalCount}
          </span>
        )}
      </div>

      <div className="h-[1px] w-full bg-white/10" />

      <div className="flex h-[30px] justify-center">
        <span className="mt-2 whitespace-nowrap text-[10px] font-bold text-gray-500">
          {label}
        </span>
      </div>
    </div>
  );
};

export const DistributionChart = ({
  title,
  myData,
  rivalData,
  isLoading,
  getColor,
  myName = "自分",
  rivalName = "ライバル",
  skeletonCount = 10,
}: DistributionChartProps) => {
  if (isLoading) {
    return <DistributionChartSkeleton count={skeletonCount} />;
  }

  if (!myData || myData.length === 0) return null;

  const rivalMap = rivalData
    ? new Map(rivalData.map((d) => [d.label, d.count]))
    : null;

  const maxCount = Math.max(
    ...myData.map((d) => d.count),
    ...(rivalData?.map((d) => d.count) || []),
    1,
  );

  return (
    <DashCard>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase text-gray-500">{title}</h3>

        {rivalData && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-xs text-blue-400">{myName}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-orange-500 opacity-60" />
              <span className="text-xs text-orange-400">{rivalName}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-1 px-1">
        {myData.map((item, i) => (
          <ChartBarUnit
            key={item.label}
            label={item.label}
            myCount={item.count}
            rivalCount={rivalMap?.get(item.label)}
            maxCount={maxCount}
            color={getColor(item.label)}
            index={i}
          />
        ))}
      </div>
    </DashCard>
  );
};
