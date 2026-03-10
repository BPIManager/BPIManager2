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
      <radialGradient
        id="radarAreaGradient"
        cx="50%"
        cy="50%"
        r="50%"
        fx="50%"
        fy="50%"
      >
        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.05} />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
      </radialGradient>

      <radialGradient id="maxDotGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="white" stopOpacity={1} />
        <stop offset="100%" stopColor="#a78bfa" stopOpacity={1} />
      </radialGradient>
    </defs>
  </svg>
);

const CustomDot = (props: any) => {
  const { cx, cy, payload, r } = props;
  if (payload && payload.isMax) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={r + 4} fill="#c084fc" fillOpacity={0.35} />
        <circle
          cx={cx}
          cy={cy}
          r={r + 1}
          fill="url(#maxDotGradient)"
          stroke="#a78bfa"
          strokeWidth={1.5}
        />
      </g>
    );
  }

  return <circle cx={cx} cy={cy} r={3} fill="#3b82f6" fillOpacity={0.5} />;
};

export const RadarSectionChart = ({ data }: { data: RadarResponse }) => {
  const chartData = useMemo(() => {
    const rawData = Object.entries(data).map(([key, value]) => ({
      category: key,
      value: Math.max(value.totalBpi, -15),
    }));

    const maxVal = Math.max(...rawData.map((d) => d.value));

    return rawData.map((d) => ({
      ...d,
      isMax: d.value === maxVal && maxVal > -15,
    }));
  }, [data]);

  const domain = useMemo(() => {
    const values = chartData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    if (range < 5) {
      return [min - 5, max + 5];
    }

    const padding = range * 0.15;

    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [chartData]);

  return (
    <Box w="full" h="330px" position="relative">
      <RadarDefs />

      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: "#9ca3af", fontSize: 12, fontWeight: "bold" }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={domain}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Total BPI"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={1.5}
            fill="url(#radarAreaGradient)"
            fillOpacity={1}
            dot={<CustomDot />}
            isAnimationActive={true}
            animationDuration={500}
          />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
};
