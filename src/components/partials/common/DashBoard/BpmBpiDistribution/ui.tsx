"use client";

import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getBpiColorStyle } from "@/constants/theme/bpiColor";
import { BPM_CONST } from "@/constants/iidx/bpmBands";
import type { BpmBandBpiItem } from "@/types/stats/distribution";
import { cn } from "@/lib/utils";

interface BpmBpiChartProps {
  myData: BpmBandBpiItem[];
  rivalData?: BpmBandBpiItem[];
  /** 指定時のみ、帯のツールチップに「対象曲一覧を表示」を出す（自分のダッシュボード用） */
  onShowList?: (label: string) => void;
  showListLabel?: string;
}

const HorizontalBar = ({
  bpi,
  color,
  opacity = 1,
  animDelay = 0,
  scaleMax,
}: {
  bpi: number;
  color: string;
  opacity?: number;
  animDelay?: number;
  scaleMax: number;
}) => {
  const { BPI_MIN } = BPM_CONST;
  const range = scaleMax - BPI_MIN;
  const clampedBpi = Math.max(BPI_MIN, Math.min(scaleMax, bpi));
  const widthPct = ((clampedBpi - BPI_MIN) / range) * 100;

  return (
    <div
      className="h-2.5 rounded-r-sm origin-left"
      style={{
        width: `${widthPct}%`,
        backgroundColor: color,
        opacity,
        animation: `growWidth 0.5s ease-out ${animDelay}s both`,
      }}
    />
  );
};

const BpmBpiChart = ({ myData, rivalData, onShowList, showListLabel }: BpmBpiChartProps) => {
  const { BPI_MAX, BPI_MIN, BPM_BAND_ORDER } = BPM_CONST;
  const rivalMap = rivalData
    ? new Map(rivalData.map((d) => [d.label, d.totalBpi]))
    : null;

  const [openLabel, setOpenLabel] = useState<string | null>(null);

  const allBpiValues = [
    ...myData.map((d) => d.totalBpi),
    ...(rivalData?.map((d) => d.totalBpi) ?? []),
  ];
  const dataMax = allBpiValues.length > 0 ? Math.max(...allBpiValues) : BPI_MAX;
  const scaleMax = Math.min(BPI_MAX, Math.ceil((dataMax + 10) / 10) * 10);

  const ordered = BPM_BAND_ORDER.map((label) => ({
    label,
    myBpi: myData.find((d) => d.label === label)?.totalBpi ?? null,
    rivalBpi: rivalMap?.get(label) ?? null,
  })).filter((row) => row.myBpi !== null || row.rivalBpi !== null);

  return (
    <>
      <style>{`@keyframes growWidth { from { width: 0 } }`}</style>
      <TooltipProvider>
      <div className="flex flex-col gap-2">
        {ordered.map((row, i) => {
          const myColor =
            row.myBpi !== null ? getBpiColorStyle(row.myBpi).bg : "transparent";
          const rivalColor =
            row.rivalBpi !== null
              ? getBpiColorStyle(row.rivalBpi).bg
              : "transparent";

          return (
            <Tooltip
              key={row.label}
              open={openLabel === row.label}
              onOpenChange={(open) => setOpenLabel(open ? row.label : null)}
            >
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors duration-150",
                    onShowList && "cursor-pointer hover:bg-bpim-overlay",
                  )}
                  onMouseEnter={() => onShowList && setOpenLabel(row.label)}
                  onClick={() => onShowList && setOpenLabel(row.label)}
                >
                <span className="w-16 shrink-0 text-right text-[11px] font-bold text-bpim-muted">
                  {row.label}
                </span>

                <div className="flex flex-1 flex-col gap-0.75">
                  {row.myBpi !== null && (
                    <HorizontalBar
                      bpi={row.myBpi}
                      color={myColor}
                      animDelay={i * 0.05}
                      scaleMax={scaleMax}
                    />
                  )}
                  {rivalMap && row.rivalBpi !== null && (
                    <HorizontalBar
                      bpi={row.rivalBpi}
                      color={rivalColor}
                      opacity={0.45}
                      animDelay={i * 0.05 + 0.02}
                      scaleMax={scaleMax}
                    />
                  )}
                </div>

                <div className="flex w-13 shrink-0 flex-col gap-0.75">
                  {row.myBpi !== null && (
                    <span
                      className="text-[11px] font-bold leading-[10px]"
                      style={{ color: myColor }}
                    >
                      {row.myBpi.toFixed(1)}
                    </span>
                  )}
                  {rivalMap && row.rivalBpi !== null && (
                    <span
                      className="text-[11px] font-bold leading-[10px] opacity-70"
                      style={{ color: rivalColor }}
                    >
                      {row.rivalBpi.toFixed(1)}
                    </span>
                  )}
                </div>
                </div>
              </TooltipTrigger>
              {onShowList && (
                <TooltipContent side="top" className="flex flex-col gap-0.5">
                  <span className="font-bold">BPM {row.label}</span>
                  {row.myBpi !== null && (
                    <span className="text-bpim-primary">{row.myBpi.toFixed(2)}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => onShowList(row.label)}
                    className="mt-1 rounded-md bg-bpim-primary px-2 py-1 text-xs font-bold text-white transition-colors hover:bg-bpim-primary/80"
                  >
                    {showListLabel}
                  </button>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}

        <div className="mt-1 flex justify-between px-17">
          <span className="text-[10px] text-bpim-muted">{BPI_MIN}</span>
          <span className="text-[10px] text-bpim-muted">0</span>
          <span className="text-[10px] text-bpim-muted">{scaleMax}</span>
        </div>
      </div>
      </TooltipProvider>
    </>
  );
};

export default BpmBpiChart;
