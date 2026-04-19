import { useState, useRef, useEffect } from "react";
import { DistributionChartSkeleton } from "@/components/partials/DashBoard/DistributionChart/skeleton";
import { DashCard } from "@/components/ui/dashcard";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useChartColors } from "@/hooks/common/useChartColors";
import type { ChartData } from "@/types/ui/chart";
import {
  PieChart,
  Pie,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart2, PieChartIcon, ZoomIn, ZoomOut } from "lucide-react";

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
  step?: number;
  onStepFiner?: () => void;
  onStepCoarser?: () => void;
  canStepFiner?: boolean;
  canStepCoarser?: boolean;
}

function tooltipHeader(label: string, step?: number): string {
  if (step === undefined) return label;
  if (label === "<-10") return "BPI < -10";
  if (label === "100+") return "BPI 100+";
  const from = parseInt(label, 10);
  if (isNaN(from)) return label;
  const to = from + step;
  return `BPI ${from} 〜 ${to >= 100 ? "100+" : to}`;
}

const ChartBarUnit = ({
  label,
  myCount,
  rivalCount,
  maxCount,
  color,
  index,
  totalCount,
  primaryColor,
  warningColor,
  showLabel,
  showCount,
  step,
  myName,
  rivalName,
  dense = false,
  maxRef,
}: {
  label: string;
  myCount: number;
  rivalCount?: number;
  maxCount: number;
  color: string;
  index: number;
  totalCount: number;
  primaryColor: string;
  warningColor: string;
  showLabel: boolean;
  showCount: boolean;
  step?: number;
  myName: string;
  rivalName: string;
  dense?: boolean;
  maxRef?: React.RefObject<HTMLDivElement | null>;
}) => {
  const [open, setOpen] = useState(false);
  const hasRival = rivalCount !== undefined;
  const myHeight = `${(myCount / maxCount) * 100}%`;
  const rivalHeight = hasRival ? `${(rivalCount! / maxCount) * 100}%` : "0%";
  const animDelay = `${Math.min((index / totalCount) * 0.5, 0.5)}s`;

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <div
          ref={maxRef}
          className={cn(
            "flex h-45 cursor-default flex-col items-stretch gap-0",
            dense ? "min-w-1 flex-1" : "min-w-0 max-w-15 flex-1",
          )}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onTouchStart={(e) => {
            e.preventDefault();
            setOpen((o) => !o);
          }}
        >
          <div className="relative h-37.5 w-full">
            <div
              className={cn(
                "absolute bottom-6.25 left-0 right-0 flex h-25 items-end justify-center",
                hasRival ? "gap-0.5" : "gap-0",
              )}
            >
              <div className="relative flex h-full flex-1 min-w-0 flex-col justify-end">
                {showCount && (
                  <span
                    className={cn(
                      "whitespace-nowrap text-[10px] font-bold text-bpim-primary",
                      myCount > 0 ? "visible" : "hidden",
                      hasRival
                        ? "absolute bottom-[calc(100%+2px)] left-1/2 -translate-x-1/2"
                        : "relative mb-0.5 w-full text-center",
                    )}
                  >
                    {myCount}
                  </span>
                )}
                <div
                  data-capture-no-anim=""
                  className="w-full origin-bottom rounded-t-xs opacity-90 animate-[bounceGrow_0.6s_ease-out_both]"
                  style={{
                    height: myHeight,
                    backgroundColor: color,
                    borderTop: `2px solid ${primaryColor}`,
                    animationDelay: animDelay,
                  }}
                />
              </div>

              {hasRival && (
                <div className="relative flex h-full flex-1 min-w-0 flex-col justify-end">
                  <div
                    data-capture-no-anim=""
                    className="w-full origin-bottom rounded-t-xs opacity-45 animate-[bounceGrow_0.6s_ease-out_both]"
                    style={{
                      height: rivalHeight,
                      backgroundColor: color,
                      borderTop: `2px solid ${warningColor}`,
                      animationDelay: animDelay,
                    }}
                  />
                </div>
              )}
            </div>

            {hasRival && showCount && (
              <span
                className={cn(
                  "absolute bottom-1.25 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-bpim-warning",
                  rivalCount! > 0 ? "visible" : "hidden",
                )}
              >
                {rivalCount}
              </span>
            )}
          </div>

          <div className="h-px w-full bg-bpim-overlay/60" />
          <div className="flex h-7.5 justify-center">
            {showLabel && (
              <span className="mt-2 whitespace-nowrap text-[10px] font-bold text-bpim-muted">
                {label}
              </span>
            )}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="flex flex-col gap-0.5">
        <span className="font-bold">{tooltipHeader(label, step)}</span>
        <span style={{ color: primaryColor }}>
          {myName}: {myCount}
        </span>
        {hasRival && (
          <span style={{ color: warningColor }}>
            {rivalName}: {rivalCount}
          </span>
        )}
      </TooltipContent>
    </Tooltip>
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
          <RechartsTooltip content={<PieTooltipContent total={total} />} />
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
  step,
  onStepFiner,
  onStepCoarser,
  canStepFiner = false,
  canStepCoarser = false,
}: DistributionChartProps) => {
  const c = useChartColors();
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");
  const containerRef = useRef<HTMLDivElement>(null);
  const maxBarRef = useRef<HTMLDivElement>(null);

  const maxIndex = myData.reduce(
    (maxI, d, i, arr) => (d.count > arr[maxI].count ? i : maxI),
    0,
  );

  useEffect(() => {
    if (!containerRef.current || !maxBarRef.current) return;
    const container = containerRef.current;
    const bar = maxBarRef.current;
    container.scrollLeft =
      bar.offsetLeft - container.offsetWidth / 2 + bar.offsetWidth / 2;
  }, [myData]);

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
          {step !== undefined && (
            <div className="flex items-center rounded-md border border-bpim-border">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onStepCoarser}
                disabled={!canStepCoarser}
                className="rounded-r-none border-r border-bpim-border"
                title="分解能を下げる"
              >
                <ZoomOut />
              </Button>
              <span className="px-2 text-xs font-bold text-bpim-muted tabular-nums">
                {step}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onStepFiner}
                disabled={!canStepFiner}
                className="rounded-l-none border-l border-bpim-border"
                title="分解能を上げる"
              >
                <ZoomIn />
              </Button>
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
        <TooltipProvider>
          <div
            ref={containerRef}
            className={cn(
              "overflow-x-auto px-1",
              myData.length > 30
                ? "flex items-start gap-0"
                : "flex items-start justify-between gap-1",
            )}
          >
            {myData.map((item, i) => {
              const numVal = parseFloat(item.label);
              const dense = myData.length > 30;
              const labelInterval = dense ? 20 : 10;
              const showLabel =
                isNaN(numVal) ||
                item.label === "100+" ||
                numVal % labelInterval === 0;
              const showCount = !step || step >= 5;
              return (
                <ChartBarUnit
                  key={item.label}
                  label={item.label}
                  myCount={item.count}
                  rivalCount={rivalMap?.get(item.label)}
                  maxCount={maxCount}
                  color={getColor(item.label)}
                  index={i}
                  totalCount={myData.length}
                  primaryColor={c.primary}
                  warningColor={c.warning}
                  showLabel={showLabel}
                  showCount={showCount}
                  step={step}
                  myName={myName}
                  rivalName={rivalName}
                  dense={myData.length > 30}
                  maxRef={i === maxIndex ? maxBarRef : undefined}
                />
              );
            })}
          </div>
        </TooltipProvider>
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
