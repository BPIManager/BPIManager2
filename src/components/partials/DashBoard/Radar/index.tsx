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
import { useChartColors } from "@/hooks/common/useChartColors";

const RadarDefs = ({
  primaryColor,
  warningColor,
}: {
  primaryColor: string;
  warningColor: string;
}) => (
  <svg style={{ height: 0, width: 0, position: "absolute" }} aria-hidden="true">
    <defs>
      <radialGradient id="radarMeGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={primaryColor} stopOpacity={0.1} />
        <stop offset="100%" stopColor={primaryColor} stopOpacity={0.5} />
      </radialGradient>
      <radialGradient id="radarRivalGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={warningColor} stopOpacity={0.1} />
        <stop offset="100%" stopColor={warningColor} stopOpacity={0.5} />
      </radialGradient>
      {/* songAttr モードで 100 超の値を炎上表現するオーバーフローグラデーション */}
      <radialGradient id="radarOverGradient" cx="50%" cy="50%" r="50%">
        <stop offset="60%" stopColor={warningColor} stopOpacity={0} />
        <stop offset="85%" stopColor={warningColor} stopOpacity={0.25} />
        <stop offset="100%" stopColor={warningColor} stopOpacity={0.65} />
      </radialGradient>
      <radialGradient id="dotMeMax" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="white" stopOpacity={1} />
        <stop offset="100%" stopColor={primaryColor} stopOpacity={1} />
      </radialGradient>
      <radialGradient id="dotRivalMax" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="white" stopOpacity={1} />
        <stop offset="100%" stopColor={warningColor} stopOpacity={1} />
      </radialGradient>
    </defs>
  </svg>
);

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: { isMeMax?: boolean; isRivalMax?: boolean };
  dataKey?: string;
  r?: number;
  primaryColor: string;
  warningColor: string;
}

const CustomDot = (props: CustomDotProps) => {
  const { cx, cy, payload, dataKey, r = 2, primaryColor, warningColor } = props;
  if (!payload) return null;
  const isMe = dataKey === "value";
  const isMax = isMe ? payload.isMeMax : payload.isRivalMax;
  const color = isMe ? primaryColor : warningColor;
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

interface RadarTooltipPayloadEntry {
  payload: {
    category: string;
    value: number;
    rivalValue?: number;
    isMeMax?: boolean;
    isRivalMax?: boolean;
  };
}

interface RadarCustomTooltipProps {
  active?: boolean;
  payload?: RadarTooltipPayloadEntry[];
}

const RadarCustomTooltip = ({ active, payload }: RadarCustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const meVal = data.value;
  const rivalVal = data.rivalValue;
  const hasRival = rivalVal !== undefined;

  return (
    <div className="min-w-[160px] rounded-md border border-bpim-border bg-bpim-surface p-3 shadow-xl">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold text-bpim-text uppercase">
          {data.category}
        </p>
        <div className="my-1 h-px w-full bg-bpim-overlay/60" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-bpim-primary" />
            <span className="text-xs font-bold text-bpim-primary">YOU</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs font-bold text-bpim-text">
              {meVal.toFixed(2)}
            </span>
            {data.isMeMax && (
              <span className="rounded bg-bpim-primary px-1 py-0.5 text-[8px] font-bold text-bpim-bg">
                BEST
              </span>
            )}
          </div>
        </div>

        {hasRival && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-bpim-warning" />
                <span className="text-xs font-bold text-bpim-warning">
                  RIVAL
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-mono text-xs font-bold text-bpim-text">
                  {rivalVal.toFixed(2)}
                </span>
                {data.isRivalMax && (
                  <span className="rounded bg-bpim-warning px-1 py-0.5 text-[8px] font-bold text-bpim-bg">
                    BEST
                  </span>
                )}
              </div>
            </div>

            <div
              className={cn(
                "mt-1 flex w-full justify-center rounded-sm py-0.5",
                meVal >= rivalVal ? "bg-bpim-success/20" : "bg-bpim-danger/20",
              )}
            >
              <p
                className={cn(
                  "text-[9px] font-bold",
                  meVal >= rivalVal ? "text-bpim-success" : "text-bpim-danger",
                )}
              >
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
};

type RadarValue = number | { totalBpi: number } | undefined;
type RadarInput = Record<string, RadarValue>;

interface RadarChartProps {
  data: RadarInput;
  rivalData?: RadarInput;
  isMini?: boolean;
  /** isMini 時のチャート高さ (px)。未指定時は 150 */
  miniHeight?: number;
  /** isMini でもツールチップを表示する */
  showTooltip?: boolean;
  /** 楽曲属性モード: domain を [0,100] 固定にし、超過値がオーバーフローして強調表示される */
  songAttr?: boolean;
  /** rivalData のみ黄色で表示し、自分のレーダー（青）を描画しない */
  rivalOnly?: boolean;
}

export const RadarSectionChart = ({
  data,
  rivalData,
  isMini = false,
  miniHeight = 150,
  showTooltip = false,
  songAttr = false,
  rivalOnly = false,
}: RadarChartProps) => {
  const c = useChartColors();

  const chartData = useMemo(() => {
    const categories =
      rivalOnly && rivalData ? Object.keys(rivalData) : Object.keys(data);

    const getBpiValue = (obj: RadarInput, key: string): number => {
      const val = obj[key] ?? obj[key.toUpperCase()];
      if (typeof val === "number") return val;
      if (val && typeof val === "object" && "totalBpi" in val)
        return val.totalBpi;
      return songAttr ? 0 : -15;
    };

    const floor = songAttr ? 0 : -15;

    const raw = categories.map((key) => ({
      category: key.toUpperCase(),
      value: Math.max(getBpiValue(data, key), floor),
      rivalValue: rivalData
        ? Math.max(getBpiValue(rivalData, key), floor)
        : undefined,
    }));

    const meMax = Math.max(...raw.map((d) => d.value));
    const rivalMax = rivalData
      ? Math.max(...raw.map((d) => d.rivalValue ?? floor))
      : floor;

    return raw.map((d) => ({
      ...d,
      // songAttr モード: グリッド内に収める capped 値（overflow Radar 用）
      valueCapped: songAttr ? Math.min(d.value, 100) : d.value,
      isMeMax: d.value === meMax && meMax > floor,
      isRivalMax: rivalData && d.rivalValue === rivalMax && rivalMax > floor,
    }));
  }, [data, rivalData, rivalOnly, songAttr]);

  const hasOverflow =
    songAttr &&
    chartData.some((d) =>
      rivalOnly
        ? d.rivalValue !== undefined && d.rivalValue > 100
        : d.value > 100,
    );

  const domain = useMemo(() => {
    if (songAttr) return [0, 100] as [number, number];
    const allValues = chartData.flatMap((d) =>
      rivalOnly
        ? [d.rivalValue].filter((v) => v !== undefined)
        : [d.value, d.rivalValue].filter((v) => v !== undefined),
    ) as number[];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = Math.max(max - min, 10);
    const padding = range * 0.2;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [chartData, songAttr]);

  const chartHeight = isMini ? miniHeight : 330;

  return (
    <div className={cn("relative w-full overflow-visible")} style={{ height: chartHeight }}>
      <RadarDefs primaryColor={c.primary} warningColor={c.warning} />
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke={`${c.grid}`} />
          {!isMini && (
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: c.muted, fontSize: 10, fontWeight: "bold" }}
            />
          )}
          <PolarRadiusAxis domain={domain} tick={false} axisLine={false} />

          {(!isMini || showTooltip) && (
            <Tooltip content={<RadarCustomTooltip />} cursor={false} />
          )}

          {!rivalOnly && (
            <Radar
              name="YOU"
              dataKey={songAttr ? "valueCapped" : "value"}
              stroke={c.primary}
              strokeWidth={1.5}
              fill="url(#radarMeGradient)"
              fillOpacity={1}
              dot={
                <CustomDot primaryColor={c.primary} warningColor={c.warning} />
              }
              isAnimationActive={!isMini}
            />
          )}

          {/* songAttr モードで 100 超の値を炎のグラデーションで強調 */}
          {hasOverflow && (
            <Radar
              name="OVERFLOW"
              dataKey={rivalOnly ? "rivalValue" : "value"}
              stroke={c.warning}
              strokeWidth={2.5}
              strokeOpacity={0.8}
              fill="url(#radarOverGradient)"
              fillOpacity={1}
              isAnimationActive={false}
              dot={false}
            />
          )}

          {rivalData && (
            <Radar
              name="RIVAL"
              dataKey="rivalValue"
              stroke={c.warning}
              strokeWidth={1.5}
              fill="url(#radarRivalGradient)"
              fillOpacity={0.6}
              dot={
                <CustomDot primaryColor={c.primary} warningColor={c.warning} />
              }
              isAnimationActive={!isMini}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
