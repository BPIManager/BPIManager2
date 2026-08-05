import { BarChart3 } from "lucide-react";
import { DashCard } from "@/components/ui/dashcard";
import { useChartColors } from "@/hooks/common/useChartColors";
import { getBpiColorStyle } from "@/constants/theme/bpiColor";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useTranslation } from "@/hooks/common/useTranslation";

const AA_BPI_DATA = [
  { bpi: 0, score: 3240 },
  { bpi: 10, score: 3381 },
  { bpi: 20, score: 3475 },
  { bpi: 30, score: 3539 },
  { bpi: 40, score: 3581 },
  { bpi: 50, score: 3610 },
  { bpi: 60, score: 3629 },
  { bpi: 70, score: 3642 },
  { bpi: 80, score: 3651 },
  { bpi: 90, score: 3657 },
  { bpi: 100, score: 3660 },
];

const BPI_SCALE_RANGE = 115;

const BPI_SEGMENTS = [
  { from: -15, to: 0 },
  ...Array.from({ length: 10 }, (_, i) => ({ from: i * 10, to: (i + 1) * 10 })),
];

const BpiScaleBar = () => {
  const { t } = useTranslation();

  const BPI_MILESTONES = [
    { bpi: -15, label: "", color: "#718096" },
    { bpi: 0, label: t("login.bpi.milestone.kaiden"), color: "#63B3ED" },
    { bpi: 50, label: t("login.bpi.milestone.top50"), color: "#48BB78" },
    { bpi: 100, label: t("login.bpi.milestone.wr"), color: "#ff00ff" },
  ];

  return (
    <div className="w-full">
      <div className="flex h-5 w-full overflow-hidden rounded-full">
        {BPI_SEGMENTS.map(({ from, to }, i) => {
          const width = ((to - from) / BPI_SCALE_RANGE) * 100;
          const midBpi = (from + to) / 2;
          const color = from < 0 ? "#4A5568" : getBpiColorStyle(midBpi).bg;
          return (
            <div
              key={i}
              style={{ width: `${width}%`, backgroundColor: color }}
            />
          );
        })}
      </div>

      <div className="relative mt-2 h-9">
        {BPI_MILESTONES.map(({ bpi, label, color }) => {
          const leftPct = ((bpi - -15) / BPI_SCALE_RANGE) * 100;
          const isRight = leftPct > 85;
          const isLeft = leftPct < 15;
          return (
            <div
              key={bpi}
              className="absolute flex flex-col"
              style={{
                left: `${leftPct}%`,
                transform: isRight
                  ? "translateX(-100%)"
                  : isLeft
                    ? "translateX(0%)"
                    : "translateX(-50%)",
              }}
            >
              <span
                className="font-mono text-[12px] font-bold leading-none"
                style={{ color }}
              >
                {bpi}
              </span>
              <span className="whitespace-nowrap text-[12px] text-bpim-muted">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BpiCurveChart = () => {
  const c = useChartColors();
  const { t } = useTranslation();

  return (
    <DashCard>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase text-bpim-muted">
            {t("login.bpi.desc.title")}
          </h4>
          <p className="mt-0.5 text-[10px] text-bpim-muted/60">
            {t("login.bpi.desc.sub")}
          </p>
        </div>
      </div>

      <div className="h-45">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={AA_BPI_DATA}
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={c.grid}
              vertical={false}
            />
            <XAxis
              dataKey="bpi"
              stroke={c.muted}
              fontSize={9}
              tickLine={false}
              axisLine={false}
              label={{
                value: "BPI",
                position: "insideBottomRight",
                offset: -4,
                fontSize: 9,
                fill: c.muted,
              }}
            />
            <YAxis
              domain={[3220, 3670]}
              stroke={c.muted}
              fontSize={9}
              tickLine={false}
              axisLine={false}
            />
            <ReferenceLine
              y={3240}
              stroke={c.muted}
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />
            <ReferenceLine
              y={3660}
              stroke={c.warning}
              strokeDasharray="4 4"
              strokeOpacity={0.7}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke={c.primary}
              strokeWidth={2.5}
              dot={(props) => {
                const color = getBpiColorStyle(props.payload.bpi as number).bg;
                return (
                  <circle
                    key={props.index}
                    cx={props.cx}
                    cy={props.cy}
                    r={3.5}
                    fill={color}
                    stroke={c.surface}
                    strokeWidth={1}
                  />
                );
              }}
              activeDot={{
                r: 4,
                fill: c.surface,
                stroke: c.primary,
                strokeWidth: 2,
              }}
              isAnimationActive
              animationDuration={1200}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center gap-4 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="h-px w-4 border-t-2 border-dashed border-bpim-muted/60" />
          <span className="text-bpim-muted">{t("login.bpi.chart.kaiden")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-px w-4 border-t-2 border-dashed border-bpim-warning/70" />
          <span className="text-bpim-warning">{t("login.bpi.chart.wr")}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-bpim-surface-2/60 px-3 py-2.5 text-[10px]">
        <div>
          <span className="text-bpim-muted">{t("login.bpi.diff.low")}</span>
          <span className="ml-1.5 font-bold text-bpim-text">+141点</span>
        </div>
        <div className="text-bpim-muted/30">vs</div>
        <div>
          <span className="text-bpim-muted">{t("login.bpi.diff.high")}</span>
          <span className="ml-1.5 font-bold text-bpim-warning">+3点</span>
        </div>
        <span className="ml-auto text-[9px] italic text-bpim-muted/50">
          {t("login.bpi.exponential")}
        </span>
      </div>
    </DashCard>
  );
};

const BpiExplainSection = () => {
  const { t } = useTranslation();

  const BPI_LANDMARKS = [
    { bpi: "0", label: t("login.bpi.landmark.kaiden"), color: "#63B3ED" },
    { bpi: "100", label: t("login.bpi.milestone.wr"), color: "#ff00ff" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-bpim-primary">
          {t("login.bpi.visualize")}
        </span>
        <h2 className="mt-2 text-2xl font-bold text-bpim-text md:text-3xl">
          {t("login.bpi.title")}
        </h2>
      </div>

      <BpiScaleBar />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-5 lg:gap-12">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex shrink-0 items-center justify-center rounded-lg bg-bpim-primary/10 p-2.5 text-bpim-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-bpim-text">
              BPI (Beat Power Indicator)
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-bpim-muted">
            {t("login.bpi.explain.p1")}
          </p>
          <p className="text-sm leading-relaxed text-bpim-muted">
            {t("login.bpi.explain.p2")}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {BPI_LANDMARKS.map(({ bpi, label, color }) => (
              <div
                key={bpi}
                className="flex items-center gap-2 rounded-lg border border-bpim-border bg-bpim-surface px-3 py-2"
              >
                <span
                  className="shrink-0 font-mono text-sm font-bold"
                  style={{ color }}
                >
                  {bpi}
                </span>
                <span className="text-[11px] leading-tight text-bpim-muted">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <BpiCurveChart />
        </div>
      </div>
    </div>
  );
};

export default BpiExplainSection;
