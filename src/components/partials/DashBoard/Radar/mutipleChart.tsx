// components/partials/DashBoard/Radar/ui.tsx
import { Box } from "@chakra-ui/react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis,
} from "recharts";
import { RadarResponse } from "@/hooks/stats/useRadar";
import { useMemo } from "react";

const RadarDefs = () => (
  <svg style={{ height: 0, width: 0, position: "absolute" }} aria-hidden="true">
    <defs>
      {/* 自分のエリア用 */}
      <radialGradient id="radarAreaGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.1} />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.5} />
      </radialGradient>
      {/* ライバルのエリア用 */}
      <radialGradient id="rivalAreaGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f97316" stopOpacity={0.1} />
        <stop offset="100%" stopColor="#f97316" stopOpacity={0.5} />
      </radialGradient>
    </defs>
  </svg>
);

interface RadarChartProps {
  data: RadarResponse;
  rivalData?: Record<string, number>; // 比較用のシンプルデータ
  isMini?: boolean; // リスト表示用の簡易モード
}

export const RadarSectionChart = ({
  data,
  rivalData,
  isMini = false,
}: RadarChartProps) => {
  const chartData = useMemo(() => {
    return Object.entries(data).map(([key, value]) => ({
      category: key,
      value: Math.max(value.totalBpi, -15),
      rivalValue: rivalData ? Math.max(rivalData[key] ?? -15, -15) : undefined,
    }));
  }, [data, rivalData]);

  const domain = useMemo(() => {
    const allValues = chartData.flatMap(
      (d) => [d.value, d.rivalValue].filter((v) => v !== undefined) as number[],
    );
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = Math.max(max - min, 10);
    const padding = range * 0.2;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [chartData]);

  return (
    <Box w="full" h={isMini ? "150px" : "330px"} position="relative">
      <RadarDefs />
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          {!isMini && (
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: "#9ca3af", fontSize: 10, fontWeight: "bold" }}
            />
          )}
          <PolarRadiusAxis domain={domain} tick={false} axisLine={false} />

          {/* 自分 (青) */}
          <Radar
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={1.5}
            fill="url(#radarAreaGradient)"
            fillOpacity={1}
            isAnimationActive={!isMini}
          />

          {/* ライバル (オレンジ) */}
          {rivalData && (
            <Radar
              dataKey="rivalValue"
              stroke="#f97316"
              strokeWidth={1.5}
              fill="url(#rivalAreaGradient)"
              fillOpacity={0.6}
              isAnimationActive={!isMini}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
};
