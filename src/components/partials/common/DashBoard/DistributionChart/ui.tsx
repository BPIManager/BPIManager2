import { useState, useRef, useEffect } from "react";
import DistributionChartSkeleton from "@/components/partials/common/DashBoard/DistributionChart/skeleton";
import { DashCard } from "@/components/ui/dashcard";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useChartColors } from "@/hooks/common/useChartColors";
import type { ChartData } from "@/types/ui/chart";
import { useTranslation } from "@/hooks/common/useTranslation";
import { BarChart2, PieChartIcon, Percent, Medal } from "lucide-react";
import type { RankDisplayMode } from "@/types/ui/distribution";
import ChartBarUnit from "./ChartBarUnit";
import DistributionPie from "./DistributionPie";
import HistogramStepControl, { type StepControl } from "./HistogramStepControl";

const animationStyles = `
  @keyframes bounceGrow {
    0%   { transform: scaleY(0); }
    60%  { transform: scaleY(1.1); }
    80%  { transform: scaleY(0.95); }
    100% { transform: scaleY(1); }
  }
`;

interface DisplayModeControl {
  mode: RankDisplayMode;
  onModeChange: (mode: RankDisplayMode) => void;
}

interface RivalComparison {
  rivalData: ChartData[];
  rivalName?: string;
}

interface DistributionChartProps {
  title: string;
  myData: ChartData[];
  isLoading: boolean;
  getColor: (label: string) => string;
  myName?: string;
  skeletonCount?: number;
  stepControl?: StepControl;
  displayMode?: DisplayModeControl;
  rivalComparison?: RivalComparison;
}

const DistributionChart = ({
  title,
  myData,
  isLoading,
  getColor,
  myName,
  skeletonCount = 10,
  stepControl,
  displayMode,
  rivalComparison,
}: DistributionChartProps) => {
  const c = useChartColors();
  const { t } = useTranslation();
  const effectiveMyName = myName ?? t("dashboard.me");
  const effectiveRivalName = rivalComparison?.rivalName ?? t("dashboard.rival");
  const rivalData = rivalComparison?.rivalData;
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

  const unit: "bpi" | "scoreRate" | undefined =
    stepControl === undefined
      ? undefined
      : displayMode?.mode === "scoreRate"
        ? "scoreRate"
        : "bpi";

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
                <span className="text-xs text-bpim-primary">{effectiveMyName}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-bpim-warning opacity-60" />
                <span className="text-xs text-bpim-warning">{effectiveRivalName}</span>
              </div>
            </div>
          )}
          {displayMode && (
            <div className="flex items-center rounded-md border border-bpim-border">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => displayMode.onModeChange("rank")}
                className={cn(
                  "rounded-r-none border-r border-bpim-border",
                  displayMode.mode === "rank" && "bg-bpim-overlay",
                )}
                aria-pressed={displayMode.mode === "rank"}
                title={t("dashboard.distribution.modeRank")}
              >
                <Medal />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => displayMode.onModeChange("scoreRate")}
                className={cn(
                  "rounded-l-none",
                  displayMode.mode === "scoreRate" && "bg-bpim-overlay",
                )}
                aria-pressed={displayMode.mode === "scoreRate"}
                title={t("dashboard.distribution.modeScoreRate")}
              >
                <Percent />
              </Button>
            </div>
          )}
          {stepControl && <HistogramStepControl {...stepControl} />}
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
              const showCount = !stepControl || stepControl.step >= 5;
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
                  step={stepControl?.step}
                  unit={unit}
                  myName={effectiveMyName}
                  rivalName={effectiveRivalName}
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
            label={rivalData ? effectiveMyName : ""}
            labelColor={c.primary}
          />
          {rivalData && (
            <DistributionPie
              data={rivalData}
              getColor={getColor}
              label={effectiveRivalName}
              labelColor={c.warning}
            />
          )}
        </div>
      )}
    </DashCard>
  );
};

export default DistributionChart;
