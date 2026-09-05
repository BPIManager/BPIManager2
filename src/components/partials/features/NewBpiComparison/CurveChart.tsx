"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { useTranslation } from "@/hooks/common/useTranslation";
import { useChartColors } from "@/hooks/common/useChartColors";

export interface CurvePoint {
  bpi: number;
  current: number | null;
  new: number | null;
}

interface UserPoint {
  exScore: number;
  currentBpi: number | null;
  newBpi: number | null;
}

interface SeriesPoint {
  score: number;
  bpi: number;
}

interface CurveTooltipPayloadItem {
  payload: SeriesPoint;
}

const CurveTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: CurveTooltipPayloadItem[];
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-bpim-border bg-bpim-bg px-3 py-2 text-xs shadow-xl">
      <p className="font-mono font-bold text-bpim-text">BPI {d.bpi}</p>
      <p className="font-mono text-bpim-muted">{Math.round(d.score)}</p>
    </div>
  );
};

interface CurveChartProps {
  data: CurvePoint[];
  userPoint: UserPoint | null;
}

/**
 * 楽曲1曲について、現行方式・新方式それぞれの「目標BPIに必要なEXスコア」を
 * BPI10刻みで結んだ推移グラフ（横軸: EXスコア, 縦軸: BPI）。
 *
 * 現行・新方式の差はEXスコア換算だと数点程度しかない楽曲が多いため、
 * X軸(EXスコア)は0〜満点ではなく実際に描画する値の範囲に合わせて
 * 自動でズームする（そうしないと差が潰れて片方の線が隠れて見える）。
 */
export default function CurveChart({ data, userPoint }: CurveChartProps) {
  const { t } = useTranslation();
  const colors = useChartColors();

  const currentSeries: SeriesPoint[] = useMemo(
    () =>
      data
        .filter((d) => d.current !== null)
        .map((d) => ({ score: d.current as number, bpi: d.bpi })),
    [data],
  );
  const newSeries: SeriesPoint[] = useMemo(
    () =>
      data
        .filter((d) => d.new !== null)
        .map((d) => ({ score: d.new as number, bpi: d.bpi })),
    [data],
  );

  const xDomain = useMemo((): [number, number] => {
    const scores = [
      ...currentSeries.map((d) => d.score),
      ...newSeries.map((d) => d.score),
      ...(userPoint ? [userPoint.exScore] : []),
    ];
    if (scores.length === 0) return [0, 1];
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const padding = Math.max((max - min) * 0.1, 1);
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [currentSeries, newSeries, userPoint]);

  return (
    <div>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="score"
            type="number"
            domain={xDomain}
            tick={{ fontSize: 10, fill: "#64748b" }}
            label={{
              value: t("newBpi.chart.xLabel"),
              position: "insideBottom",
              offset: -15,
              fontSize: 10,
              fill: "#64748b",
            }}
          />
          <YAxis
            dataKey="bpi"
            type="number"
            domain={[-15, 100]}
            ticks={[-15, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
            tick={{ fontSize: 10, fill: "#64748b" }}
            label={{
              value: t("newBpi.chart.yLabel"),
              angle: -90,
              position: "insideLeft",
              offset: 15,
              fontSize: 10,
              fill: "#64748b",
            }}
          />
          <Tooltip
            content={(props) => (
              <CurveTooltip
                active={props.active}
                payload={
                  props.payload as unknown as CurveTooltipPayloadItem[] | undefined
                }
              />
            )}
          />
          <Line
            data={currentSeries}
            dataKey="bpi"
            name={t("newBpi.table.currentBpi")}
            stroke={colors.primary}
            strokeWidth={2}
            dot={{ r: 2 }}
            isAnimationActive={false}
          />
          <Line
            data={newSeries}
            dataKey="bpi"
            name={t("newBpi.table.newBpi")}
            stroke={colors.warning}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={{ r: 2 }}
            isAnimationActive={false}
          />
          {userPoint && (
            <>
              {userPoint.currentBpi !== null && (
                <ReferenceDot
                  x={userPoint.exScore}
                  y={userPoint.currentBpi}
                  r={5}
                  fill={colors.primary}
                  stroke="none"
                />
              )}
              {userPoint.newBpi !== null && (
                <ReferenceDot
                  x={userPoint.exScore}
                  y={userPoint.newBpi}
                  r={5}
                  fill={colors.warning}
                  stroke="none"
                />
              )}
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-bpim-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-bpim-primary" />
          {t("newBpi.table.currentBpi")}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
          {t("newBpi.table.newBpi")}
        </span>
        {userPoint && (
          <span className="flex items-center gap-1">
            {t("newBpi.chart.userPoint")}
          </span>
        )}
      </div>
    </div>
  );
}
