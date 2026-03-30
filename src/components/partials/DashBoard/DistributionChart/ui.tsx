import { useState } from "react";
import { DistributionChartSkeleton } from "@/components/partials/DashBoard/DistributionChart/skeleton";
import { DashCard } from "@/components/ui/dashcard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChartColors } from "@/hooks/common/useChartColors";
import type { ChartData } from "@/types/ui/chart";
import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart2, PieChartIcon } from "lucide-react";

const animationStyles = `
  @keyframes bounceGrow {
    0%   { transform: scaleY(0); }
    60%  { transform: scaleY(1.1); }
    80%  { transform: scaleY(0.95); }
    100% { transform: scaleY(1); }
  }
`;

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
              data-capture-no-anim=""
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
                data-capture-no-anim=""
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

const PieTooltipContent = ({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
  total: number;
}) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const percent = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="rounded-md border border-bpim-border bg-bpim-surface px-2 py-1 text-xs shadow">
      <span className="font-bold">{name}</span>
      <span className="ml-2 text-bpim-muted">
        {value} ({percent.toFixed(1)}%)
      </span>
    </div>
  );
};

const DistributionPie = ({
  data,
  getColor,
  label,
  labelColor,
}: {
  data: ChartData[];
  getColor: (label: string) => string;
  label: string;
  labelColor: string;
}) => {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const filtered = [...data]
    .reverse()
    .filter((d) => d.count > 0)
    .map((d) => ({ ...d, fill: getColor(d.label) }));
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie
            data={filtered}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius="40%"
            outerRadius="100%"
            paddingAngle={2}
            startAngle={90}
            endAngle={-270}
          />
          <Tooltip content={<PieTooltipContent total={total} />} />
        </PieChart>
      </ResponsiveContainer>
      <span className="text-xs font-bold" style={{ color: labelColor }}>
        {label}
      </span>
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
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");

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
        <div className="flex items-center gap-3">
          {rivalData && chartType === "bar" && (
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
          <div className="flex items-center rounded-md border border-bpim-border">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setChartType("bar")}
              className={cn(
                "rounded-r-none border-r border-bpim-border",
                chartType === "bar" && "bg-bpim-overlay",
              )}
              aria-pressed={chartType === "bar"}
            >
              <BarChart2 />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setChartType("pie")}
              className={cn(
                "rounded-l-none",
                chartType === "pie" && "bg-bpim-overlay",
              )}
              aria-pressed={chartType === "pie"}
            >
              <PieChartIcon />
            </Button>
          </div>
        </div>
      </div>

      {chartType === "bar" ? (
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
      ) : (
        <div className="flex items-start justify-center gap-2">
          <DistributionPie
            data={myData}
            getColor={getColor}
            label={rivalData ? myName : ""}
            labelColor={c.primary}
          />
          {rivalData && (
            <DistributionPie
              data={rivalData}
              getColor={getColor}
              label={rivalName}
              labelColor={c.warning}
            />
          )}
        </div>
      )}
    </DashCard>
  );
};
