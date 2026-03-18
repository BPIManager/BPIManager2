import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis,
  Tooltip,
} from "recharts";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

const RadarDefs = () => (
  <svg style={{ height: 0, width: 0, position: "absolute" }} aria-hidden="true">
    <defs>
      <radialGradient id="radarMeGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.1} />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.5} />
      </radialGradient>
      <radialGradient id="radarRivalGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f97316" stopOpacity={0.1} />
        <stop offset="100%" stopColor="#f97316" stopOpacity={0.5} />
      </radialGradient>
      <radialGradient id="dotMeMax" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="white" stopOpacity={1} />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity={1} />
      </radialGradient>
      <radialGradient id="dotRivalMax" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="white" stopOpacity={1} />
        <stop offset="100%" stopColor="#f97316" stopOpacity={1} />
      </radialGradient>
    </defs>
  </svg>
);

const CustomDot = (props: any) => {
  const { cx, cy, payload, dataKey, r } = props;
  const isMe = dataKey === "value";
  const isMax = isMe ? payload.isMeMax : payload.isRivalMax;
  const color = isMe ? "#3b82f6" : "#f97316";
  const grad = isMe ? "url(#dotMeMax)" : "url(#dotRivalMax)";

  if (isMax) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={r + 3} fill={color} fillOpacity={0.3} />
        <circle
          cx={cx}
          cy={cy}
          r={r + 0.5}
          fill={grad}
          stroke="white"
          strokeWidth={1}
        />
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={2} fill={color} fillOpacity={0.6} />;
};

const RadarCustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const meVal = data.value;
    const rivalVal = data.rivalValue;
    const hasRival = rivalVal !== undefined;

    return (
      <div className="min-w-[160px] rounded-md border border-white/20 bg-bpim-bg p-3 shadow-xl">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold text-white uppercase">
            {data.category}
          </p>
          <div className="my-1 h-px w-full bg-white/10" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-bpim-primary" />
              <span className="text-xs font-bold text-bpim-primary">YOU</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs font-bold text-white">
                {meVal.toFixed(2)}
              </span>
              {data.isMeMax && (
                <span className="rounded bg-bpim-primary px-1 py-0.5 text-[8px] font-bold text-white">
                  BEST
                </span>
              )}
            </div>
          </div>

          {hasRival && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  <span className="text-xs font-bold text-bpim-warning">
                    RIVAL
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs font-bold text-white">
                    {rivalVal.toFixed(2)}
                  </span>
                  {data.isRivalMax && (
                    <span className="rounded bg-orange-600 px-1 py-0.5 text-[8px] font-bold text-white">
                      BEST
                    </span>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "mt-1 flex w-full justify-center rounded-sm py-0.5",
                  meVal >= rivalVal ? "bg-green-900/50" : "bg-red-900/50",
                )}
              >
                <p className="text-[9px] font-bold text-white">
                  {meVal >= rivalVal
                    ? `WIN (+${(meVal - rivalVal).toFixed(2)})`
                    : `LOSE (${(meVal - rivalVal).toFixed(2)})`}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
  return null;
};

type RadarValue = number | { totalBpi: number } | undefined;
type RadarInput = Record<string, RadarValue>;

interface RadarChartProps {
  data: RadarInput;
  rivalData?: RadarInput;
  isMini?: boolean;
}

export const RadarSectionChart = ({
  data,
  rivalData,
  isMini = false,
}: RadarChartProps) => {
  const chartData = useMemo(() => {
    const categories = [
      "notes",
      "chord",
      "peak",
      "charge",
      "scratch",
      "soflan",
    ];

    const getBpiValue = (obj: RadarInput, key: string): number => {
      const val = obj[key] ?? obj[key.toUpperCase()];
      if (typeof val === "number") return val;
      if (val && typeof val === "object" && "totalBpi" in val)
        return val.totalBpi;
      return -15;
    };

    const raw = categories.map((key) => ({
      category: key.toUpperCase(),
      value: Math.max(getBpiValue(data, key), -15),
      rivalValue: rivalData
        ? Math.max(getBpiValue(rivalData, key), -15)
        : undefined,
    }));

    const meMax = Math.max(...raw.map((d) => d.value));
    const rivalMax = rivalData
      ? Math.max(...raw.map((d) => d.rivalValue ?? -15))
      : -15;

    return raw.map((d) => ({
      ...d,
      isMeMax: d.value === meMax && meMax > -15,
      isRivalMax: rivalData && d.rivalValue === rivalMax && rivalMax > -15,
    }));
  }, [data, rivalData]);

  const domain = useMemo(() => {
    const allValues = chartData.flatMap((d) =>
      [d.value, d.rivalValue].filter((v) => v !== undefined),
    ) as number[];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = Math.max(max - min, 10);
    const padding = range * 0.2;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [chartData]);

  return (
    <div className={cn("relative w-full", isMini ? "h-[150px]" : "h-[330px]")}>
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

          {!isMini && (
            <Tooltip content={<RadarCustomTooltip />} cursor={false} />
          )}

          <Radar
            name="YOU"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={1.5}
            fill="url(#radarMeGradient)"
            fillOpacity={1}
            dot={<CustomDot />}
            isAnimationActive={!isMini}
          />

          {rivalData && (
            <Radar
              name="RIVAL"
              dataKey="rivalValue"
              stroke="#f97316"
              strokeWidth={1.5}
              fill="url(#radarRivalGradient)"
              fillOpacity={0.6}
              dot={<CustomDot />}
              isAnimationActive={!isMini}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
