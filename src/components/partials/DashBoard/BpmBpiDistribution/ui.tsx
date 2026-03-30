"use client";

import { getBpiColorStyle } from "@/constants/bpiColor";
import { BPM_CONST } from "@/constants/bpm";
import { useChartColors } from "@/hooks/common/useChartColors";
import type { BpmBandBpiItem } from "@/types/stats/distribution";

interface BpmBpiChartProps {
  myData: BpmBandBpiItem[];
  rivalData?: BpmBandBpiItem[];
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
      className="h-[10px] rounded-r-sm origin-left"
      style={{
        width: `${widthPct}%`,
        backgroundColor: color,
        opacity,
        animation: `growWidth 0.5s ease-out ${animDelay}s both`,
      }}
    />
  );
};

export const BpmBpiChart = ({ myData, rivalData }: BpmBpiChartProps) => {
  const { BPI_MAX, BPI_MIN, BPM_BAND_ORDER } = BPM_CONST;
  const c = useChartColors();
  const rivalMap = rivalData
    ? new Map(rivalData.map((d) => [d.label, d.totalBpi]))
    : null;

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
      <div className="flex flex-col gap-2">
        {ordered.map((row, i) => {
          const myColor =
            row.myBpi !== null ? getBpiColorStyle(row.myBpi).bg : "transparent";
          const rivalColor =
            row.rivalBpi !== null
              ? getBpiColorStyle(row.rivalBpi).bg
              : "transparent";

          return (
            <div key={row.label} className="flex items-center gap-2">
              <span className="w-[64px] shrink-0 text-right text-[11px] font-bold text-bpim-muted">
                {row.label}
              </span>

              <div className="flex flex-1 flex-col gap-[3px]">
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

              <div className="flex w-[52px] shrink-0 flex-col gap-[3px]">
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
          );
        })}

        <div className="mt-1 flex justify-between px-[68px]">
          <span className="text-[10px] text-bpim-muted">{BPI_MIN}</span>
          <span className="text-[10px] text-bpim-muted">0</span>
          <span className="text-[10px] text-bpim-muted">{scaleMax}</span>
        </div>
      </div>
    </>
  );
};
