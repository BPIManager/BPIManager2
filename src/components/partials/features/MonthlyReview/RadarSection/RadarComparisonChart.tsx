import { useTranslation } from "@/hooks/common/useTranslation";
import type { RadarGrowthEntry } from "@/types/stats/monthlyReview";
import {
  ResponsiveContainer,
  Tooltip,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";
import { ELEMENT_LABELS, ELEMENT_COLORS } from "./constants";

interface RadarDataPoint {
  subject: string;
  element: string;
  start: number;
  end: number;
  growthPct: number;
  bpiStart: number;
  bpiEnd: number;
  diff: number;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: RadarDataPoint }>;
}) => {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const color = ELEMENT_COLORS[d.element] ?? "#94a3b8";
  const growthPct = d.growthPct.toFixed(1);
  const sign = d.diff >= 0 ? "+" : "";
  return (
    <div
      style={{
        background: "rgba(8,8,14,0.92)",
        border: `1px solid ${color}55`,
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 11,
        minWidth: 140,
      }}
    >
      <p style={{ color, fontWeight: "bold", marginBottom: 6 }}>
        {d.subject}
      </p>
      <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>
        {t("monthlyReview.radar.growthRateTooltip")}:{" "}
        <span
          style={{
            color: d.end >= 1 ? color : "#f87171",
            fontWeight: "bold",
          }}
        >
          {d.end >= 1 ? "+" : ""}
          {growthPct}%
        </span>
      </p>
      <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>
        {t("monthlyReview.radar.growthAbsTooltip")}:{" "}
        <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: "bold" }}>
          {sign}
          {d.diff.toFixed(2)}
        </span>
      </p>
      <p
        style={{ color: "rgba(255,255,255,0.3)", marginTop: 4, fontSize: 10 }}
      >
        {d.bpiStart.toFixed(2)}{" "}
        <span style={{ color: "rgba(255,255,255,0.2)" }}>→</span>{" "}
        <span style={{ color }}>{d.bpiEnd.toFixed(2)}</span>
      </p>
    </div>
  );
};

function RadarComparisonChart({
  entries,
  inView,
}: {
  entries: RadarGrowthEntry[];
  inView: boolean;
}) {
  const { t } = useTranslation();
  if (entries.length < 3) return null;

  const radarData: RadarDataPoint[] = entries.map((e) => {
    const diff = e.totalDiff;
    const rawGrowth = e.totalDiff / Math.max(Math.abs(e.bpiStart), 5);
    const growthRate = Math.pow(1 + Math.max(rawGrowth, 0), 2);
    return {
      subject: ELEMENT_LABELS[e.element] ?? e.element,
      element: e.element,
      start: 1,
      end: growthRate,
      growthPct: rawGrowth * 100,
      bpiStart: e.bpiStart,
      bpiEnd: e.bpiEnd,
      diff,
    };
  });

  const maxGrowth = Math.max(...radarData.map((d) => d.end), 1.1);
  const domain: [number, number] = [0, Math.ceil(maxGrowth * 10) / 10 + 0.1];

  return (
    <div
      className="w-full max-w-lg mx-auto"
      style={{
        animation: inView ? "radarFade 0.7s ease-out 0.25s both" : "none",
      }}
    >
      <p
        className="mb-1 text-center text-[10px] font-bold tracking-[0.3em] uppercase"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {t("monthlyReview.radar.elementGrowth")}
      </p>
      <ResponsiveContainer width="100%" aspect={1}>
        <RadarChart
          data={radarData}
          margin={{ top: 20, right: 52, bottom: 20, left: 52 }}
        >
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={(props) => {
              const { x, y, payload } = props as unknown as {
                x: number;
                y: number;
                cx: number;
                cy: number;
                payload: { value: string };
              };
              const element = entries.find(
                (e) =>
                  (ELEMENT_LABELS[e.element] ?? e.element) === payload.value,
              );
              const color = element
                ? (ELEMENT_COLORS[element.element] ?? "#94a3b8")
                : "#94a3b8";
              return (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={color}
                  fontSize={11}
                  fontWeight="bold"
                >
                  {payload.value}
                </text>
              );
            }}
          />
          <PolarRadiusAxis domain={domain} tick={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name={t("monthlyReview.radar.before")}
            dataKey="start"
            stroke="rgba(255,255,255,0.2)"
            fill="rgba(255,255,255,0.04)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
          />
          <Radar
            name={t("monthlyReview.radar.after")}
            dataKey="end"
            stroke="rgba(255,255,255,0.6)"
            fill="rgba(255,255,255,0.0)"
            strokeWidth={2}
            dot={({ cx, cy, payload }) => {
              const element = entries.find(
                (e) =>
                  (ELEMENT_LABELS[e.element] ?? e.element) === payload.subject,
              );
              const color = element
                ? (ELEMENT_COLORS[element.element] ?? "#94a3b8")
                : "#94a3b8";
              return (
                <circle
                  key={`dot-${cx}-${cy}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={color}
                  stroke="rgba(8,8,14,0.8)"
                  strokeWidth={1.5}
                />
              );
            }}
          />
          <Legend
            iconSize={8}
            iconType="circle"
            wrapperStyle={{
              fontSize: 10,
              color: "rgba(255,255,255,0.4)",
              paddingTop: 4,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RadarComparisonChart;
