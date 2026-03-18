import { DistributionChartSkeleton } from "@/components/partials/DashBoard/DistributionChart/skeleton";
import { DashCard } from "@/components/ui/dashcard";
import { cn } from "@/lib/utils";
import { useChartColors } from "@/hooks/common/useChartColors";

const animationStyles = `
  @keyframes bounceGrow {
    0%   { transform: scaleY(0); }
    60%  { transform: scaleY(1.1); }
    80%  { transform: scaleY(0.95); }
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
  primaryColor,
  warningColor,
}: {
  label: string;
  myCount: number;
  rivalCount?: number;
  maxCount: number;
  color: string;
  index: number;
  primaryColor: string;
  warningColor: string;
}) => {
  const hasRival = rivalCount !== undefined;
  const myHeight = `${(myCount / maxCount) * 100}%`;
  const rivalHeight = hasRival ? `${(rivalCount! / maxCount) * 100}%` : "0%";

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
                "whitespace-nowrap text-[10px] font-bold text-bpim-primary",
                myCount > 0 ? "visible" : "hidden",
                hasRival
                  ? "absolute bottom-[calc(100%+2px)] left-1/2 -translate-x-1/2"
                  : "relative mb-[2px] w-full text-center",
              )}
            >
              {myCount}
            </span>
            <div
              className="w-full origin-bottom rounded-t-[2px] opacity-90 animate-[bounceGrow_0.6s_ease-out_both]"
              style={{
                height: myHeight,
                backgroundColor: color,
                borderTop: `2px solid ${primaryColor}`,
                animationDelay: `${index * 0.04}s`,
              }}
            />
          </div>

          {hasRival && (
            <div className="relative flex h-full flex-1 min-w-0 flex-col justify-end">
              <div
                className="w-full origin-bottom rounded-t-[2px] opacity-45 animate-[bounceGrow_0.6s_ease-out_both]"
                style={{
                  height: rivalHeight,
                  backgroundColor: color,
                  borderTop: `2px solid ${warningColor}`,
                  animationDelay: `${index * 0.04 + 0.02}s`,
                }}
              />
            </div>
          )}
        </div>

        {hasRival && (
          <span
            className={cn(
              "absolute bottom-[5px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-bpim-warning",
              rivalCount! > 0 ? "visible" : "hidden",
            )}
          >
            {rivalCount}
          </span>
        )}
      </div>

      <div className="h-[1px] w-full bg-bpim-overlay/60" />
      <div className="flex h-[30px] justify-center">
        <span className="mt-2 whitespace-nowrap text-[10px] font-bold text-bpim-muted">
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
  const c = useChartColors();

  if (isLoading) return <DistributionChartSkeleton count={skeletonCount} />;
  if (!myData || myData.length === 0) return null;

  const rivalMap = rivalData
    ? new Map(rivalData.map((d) => [d.label, d.count]))
    : null;

  const maxCount = Math.max(
    ...myData.map((d) => d.count),
    ...(rivalData?.map((d) => d.count) ?? []),
    1,
  );

  return (
    <DashCard>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase text-bpim-muted">{title}</h3>
        {rivalData && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-bpim-primary" />
              <span className="text-xs text-bpim-primary">{myName}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-bpim-warning opacity-60" />
              <span className="text-xs text-bpim-warning">{rivalName}</span>
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
            primaryColor={c.primary}
            warningColor={c.warning}
          />
        ))}
      </div>
    </DashCard>
  );
};
