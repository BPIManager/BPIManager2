import {
  BarChart3,
  ShieldCheck,
  Wrench,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Meta } from "../Head";
import { DashboardLayout } from "../Main";
import { PageContainer } from "../Header";
import { Separator } from "@/components/ui/separator";
import { DashCard } from "@/components/ui/dashcard";
import { useChartColors } from "@/hooks/common/useChartColors";
import { getBpiColorStyle } from "@/constants/bpiColor";
import {
  ComposedChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { authActions } from "@/lib/firebase/auth";
import Link from "next/link";

// ─── Static mock data ────────────────────────────────────────────────────────

const BPI_HISTORY_MOCK = [
  { date: "4月", bpi: 14.2, count: 3 },
  { date: "5月", bpi: 16.8, count: 12 },
  { date: "6月", bpi: 20.4, count: 8 },
  { date: "7月", bpi: 22.1, count: 5 },
  { date: "8月", bpi: 25.6, count: 14 },
  { date: "9月", bpi: 28.3, count: 9 },
  { date: "10月", bpi: 31.7, count: 11 },
  { date: "11月", bpi: 34.2, count: 7 },
  { date: "12月", bpi: 36.9, count: 10 },
  { date: "1月", bpi: 40.1, count: 15 },
  { date: "2月", bpi: 43.5, count: 8 },
  { date: "3月", bpi: 47.83, count: 13 },
];

const RADAR_MOCK_DATA = [
  { category: "NOTES", value: 52, rivalValue: 44 },
  { category: "CHORD", value: 38, rivalValue: 55 },
  { category: "PEAK", value: 61, rivalValue: 43 },
  { category: "CHARGE", value: 44, rivalValue: 39 },
  { category: "SCRATCH", value: 29, rivalValue: 62 },
  { category: "SOFLAN", value: 55, rivalValue: 41 },
];

const BPM_MOCK_DATA = [
  { label: "~99", myBpi: 41, rivalBpi: 35 },
  { label: "100~139", myBpi: 48, rivalBpi: 52 },
  { label: "140~159", myBpi: 36, rivalBpi: 41 },
  { label: "160~179", myBpi: 52, rivalBpi: 45 },
  { label: "180~199", myBpi: 29, rivalBpi: 38 },
  { label: "200+", myBpi: 19, rivalBpi: 22 },
];

const BPI_DIST_MOCK = [
  { label: "<-10", bpi: -15 },
  { label: "-10~0", bpi: -5 },
  { label: "0~10", bpi: 5 },
  { label: "10~20", bpi: 15 },
  { label: "20~30", bpi: 25 },
  { label: "30~40", bpi: 35 },
  { label: "40~50", bpi: 45 },
  { label: "50~60", bpi: 55 },
  { label: "60~70", bpi: 65 },
  { label: "70~80", bpi: 75 },
  { label: "80+", bpi: 85 },
];
const BPI_DIST_COUNTS = [8, 24, 45, 52, 41, 34, 22, 14, 8, 5, 2];

// AA(SPA) の BPI ↔ 必要スコア対応表（係数 1.0、ドキュメント記載値）
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

// 7 rows × 20 cols — deterministic, no Math.random()
const ACTIVITY_MOCK = [
  0, 1, 0, 2, 0, 1, 3, 0, 0, 1, 0, 2, 1, 0, 0, 1, 0, 3, 0, 1, 1, 0, 2, 0, 1, 0,
  2, 1, 0, 2, 0, 1, 3, 0, 1, 0, 2, 0, 1, 0, 0, 2, 0, 1, 3, 0, 1, 0, 2, 0, 3, 2,
  0, 1, 0, 2, 1, 0, 2, 0, 1, 0, 3, 0, 0, 2, 0, 3, 1, 0, 1, 0, 2, 3, 0, 1, 0, 2,
  0, 1, 0, 1, 0, 2, 1, 0, 2, 0, 1, 3, 0, 1, 0, 2, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0,
  3, 1, 0, 2, 0, 1, 2, 0, 1, 3, 0, 1, 0, 2, 1, 0, 0, 3, 0, 1, 0, 2, 1, 0, 2, 0,
  1, 3, 0, 0, 2, 0, 1, 0, 3, 1,
];

const ACTIVITY_COLORS = [
  "var(--activity-0)",
  "var(--activity-1)",
  "var(--activity-2)",
  "var(--activity-3)",
  "var(--activity-4)",
];

const CHART_ANIMS = `
  @keyframes growWidth { from { width: 0 } }
  @keyframes bounceGrow {
    0%   { transform: scaleY(0); }
    60%  { transform: scaleY(1.1); }
    80%  { transform: scaleY(0.95); }
    100% { transform: scaleY(1); }
  }
`;

// ─── Provider icons ──────────────────────────────────────────────────────────

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="currentColor"
  >
    <title>Google</title>
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
  </svg>
);

const XProviderIcon = ({ className }: { className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="currentColor"
  >
    <title>X</title>
    <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
  </svg>
);

const LineProviderIcon = ({ className }: { className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="currentColor"
  >
    <title>LINE</title>
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.630 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

// ─── Login section ────────────────────────────────────────────────────────────

const LoginSection = () => (
  <div className="mx-auto w-full max-w-sm">
    {/* Google — primary */}
    <button
      onClick={() => authActions.signInWithGoogle()}
      className="group relative flex h-14 w-full items-center gap-4 overflow-hidden rounded-xl bg-white px-6 shadow-lg transition-all duration-200 hover:brightness-95 active:scale-[0.98]"
    >
      <GoogleIcon className="h-5 w-5 shrink-0 text-gray-500" />
      <span className="flex-1 text-left text-sm font-bold text-gray-800">
        Googleでログイン
      </span>
      <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>

    {/* Divider */}
    <div className="my-4 flex items-center gap-3">
      <div className="flex-1 border-t border-bpim-border" />
      <span className="text-[11px] font-medium uppercase tracking-wider text-bpim-muted/50">
        または
      </span>
      <div className="flex-1 border-t border-bpim-border" />
    </div>

    {/* X and LINE */}
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => authActions.signInWithTwitter()}
        className="group flex h-12 items-center justify-center gap-2.5 rounded-xl border border-bpim-border bg-bpim-surface px-4 transition-all duration-200 hover:border-white/30 hover:bg-bpim-overlay active:scale-[0.98]"
      >
        <XProviderIcon className="h-4 w-4 text-bpim-text" />
        <span className="text-sm font-semibold text-bpim-text">X</span>
      </button>
      <button
        onClick={() => authActions.signInWithLINE()}
        className="group flex h-12 items-center justify-center gap-2.5 rounded-xl border border-[#00B900]/30 bg-[#00B900]/5 px-4 transition-all duration-200 hover:border-[#00B900]/50 hover:bg-[#00B900]/10 active:scale-[0.98]"
      >
        <LineProviderIcon className="h-4 w-4 text-[#4ade80]" />
        <span className="text-sm font-semibold text-[#4ade80]">LINE</span>
      </button>
    </div>

    {/* Terms */}
    <p className="mt-5 text-center text-[11px] leading-relaxed text-bpim-muted/60">
      続行することで、
      <Link
        target="_blank"
        className="underline underline-offset-2 hover:text-bpim-muted"
        href="https://www.notion.so/BPIM2-3239989ca87a809f8058dc9736f0e197"
      >
        利用規約・プライバシーポリシー・データポリシー
      </Link>
      に同意したものとみなされます。
    </p>
  </div>
);

// ─── BPIとは？ section ────────────────────────────────────────────────────────

const BPI_SCALE_RANGE = 115; // -15 → 100

const BPI_SEGMENTS = [
  { from: -15, to: 0 },
  ...Array.from({ length: 10 }, (_, i) => ({ from: i * 10, to: (i + 1) * 10 })),
];

const BPI_MILESTONES = [
  { bpi: -15, label: "", color: "#718096" },
  { bpi: 0, label: "皆伝平均(約2699位)", color: "#63B3ED" },
  { bpi: 50, label: "約50位", color: "#48BB78" },
  { bpi: 100, label: "歴代全一", color: "#ff00ff" },
];

const BPI_LANDMARKS = [
  { bpi: "0", label: "皆伝平均", color: "#63B3ED" },
  { bpi: "100", label: "歴代全一", color: "#ff00ff" },
];

const BpiScaleBar = () => (
  <div className="w-full">
    <div className="flex h-5 w-full overflow-hidden rounded-full">
      {BPI_SEGMENTS.map(({ from, to }, i) => {
        const width = ((to - from) / BPI_SCALE_RANGE) * 100;
        const midBpi = (from + to) / 2;
        const color = from < 0 ? "#4A5568" : getBpiColorStyle(midBpi).bg;
        return (
          <div key={i} style={{ width: `${width}%`, backgroundColor: color }} />
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

const BpiCurveChart = () => {
  const c = useChartColors();
  return (
    <DashCard>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase text-bpim-muted">
            AA (SPA) を例に
          </h4>
          <p className="mt-0.5 text-[10px] text-bpim-muted/60">
            BPI と必要 EX スコアの関係（係数 1.0）
          </p>
        </div>
      </div>

      <div className="h-[180px]">
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
          <div className="h-[1px] w-4 border-t-2 border-dashed border-bpim-muted/60" />
          <span className="text-bpim-muted">皆伝平均 3240</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-[1px] w-4 border-t-2 border-dashed border-bpim-warning/70" />
          <span className="text-bpim-warning">全一 3660</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-bpim-surface-2/60 px-3 py-2.5 text-[10px]">
        <div>
          <span className="text-bpim-muted">BPI 0→10</span>
          <span className="ml-1.5 font-bold text-bpim-text">+141点</span>
        </div>
        <div className="text-bpim-muted/30">vs</div>
        <div>
          <span className="text-bpim-muted">BPI 90→100</span>
          <span className="ml-1.5 font-bold text-bpim-warning">+3点</span>
        </div>
        <span className="ml-auto text-[9px] italic text-bpim-muted/50">
          高BPIほど指数関数的に希少
        </span>
      </div>
    </DashCard>
  );
};

const BpiExplainSection = () => (
  <div className="flex flex-col gap-8">
    <div className="text-center">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-bpim-primary">
        Visualize your skills with BPI
      </span>
      <h2 className="mt-2 text-2xl font-bold text-bpim-text md:text-3xl">
        BPIで実力を可視化する
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
          BPIとは、 beatmania IIDX の腕前を統計的に数値化するための指標です。
          <br />
          <strong className="text-bpim-text">
            BPI 0 = 皆伝平均・BPI 100 = 歴代全一
          </strong>
          となるよう設計されており、自分が上位プレイヤー層の中でどの水準にいるかが数値として一目で可視化されます。
        </p>
        <p className="text-sm leading-relaxed text-bpim-muted">
          EXスコアと BPI の関係は非線形です。高 BPI
          帯ではBPIを1上げるために必要なスコア増分は小さくなりますが、理論値付近を要求されるため、実際の難易度は指数関数的に増加します。
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

// ─── Dashboard mock charts ────────────────────────────────────────────────────

const MockBpiHistoryChart = () => {
  const c = useChartColors();
  return (
    <DashCard className="h-[260px]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-bpim-muted">
          総合BPI推移
        </h3>
      </div>
      <div className="h-[195px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={BPI_HISTORY_MOCK}
            margin={{ top: 5, right: 5, left: -28, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={c.grid}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke={c.muted}
              fontSize={9}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[10, 55]}
              stroke={c.muted}
              fontSize={9}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => String(v)}
            />
            <YAxis yAxisId={1} hide domain={[0, 30]} />
            <Bar
              yAxisId={1}
              dataKey="count"
              barSize={4}
              fill={c.primary}
              opacity={0.2}
              radius={[2, 2, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="bpi"
              stroke={c.primary}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                fill: c.surface,
                stroke: c.primary,
                strokeWidth: 2,
              }}
              connectNulls
              animationDuration={1500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </DashCard>
  );
};

const MockCurrentBpiCard = () => (
  <DashCard>
    <span className="text-[10px] font-bold uppercase tracking-widest text-bpim-muted">
      総合BPI（☆12のみ）
    </span>
    <div className="mt-4 flex flex-row items-end gap-6">
      <span className="font-mono text-4xl font-bold tabular-nums leading-none tracking-tighter text-bpim-text">
        47.83
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-bpim-muted">
          推定順位
        </span>
        <span className="text-lg font-bold text-bpim-text">
          ~62
          <span className="ml-1 text-xs font-normal text-bpim-muted">位</span>
        </span>
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2 rounded-lg border border-bpim-primary/30 bg-bpim-primary/5 px-3 py-2">
      <span className="font-mono text-[10px] text-bpim-muted">2025-04-01</span>
      <span className="font-mono text-sm text-bpim-muted">38.21</span>
      <span className="ml-auto flex items-center gap-1 font-mono text-sm font-bold text-bpim-success">
        <TrendingUp className="h-3 w-3" />
        +9.62
      </span>
    </div>
  </DashCard>
);

const MockRadarChart = () => {
  const c = useChartColors();
  return (
    <DashCard>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-bpim-muted">
          BPIレーダー
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-[2px] w-3 bg-bpim-primary" />
            <span className="text-[10px] text-bpim-primary">自分</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-[2px] w-3 border-t-2 border-dashed border-bpim-warning" />
            <span className="text-[10px] text-bpim-warning">ライバル</span>
          </div>
        </div>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="75%"
            data={RADAR_MOCK_DATA}
          >
            <PolarGrid stroke={c.grid} />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: c.muted, fontSize: 10, fontWeight: "bold" }}
            />
            <PolarRadiusAxis domain={[0, 80]} tick={false} axisLine={false} />
            <Radar
              name="YOU"
              dataKey="value"
              stroke={c.primary}
              strokeWidth={1.5}
              fill={c.primary}
              fillOpacity={0.25}
              dot={false}
              isAnimationActive
            />
            <Radar
              name="RIVAL"
              dataKey="rivalValue"
              stroke={c.warning}
              strokeWidth={1.5}
              fill={c.warning}
              fillOpacity={0.15}
              dot={false}
              isAnimationActive
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </DashCard>
  );
};

const MockBpmBars = () => {
  const BPI_MIN = -15;
  const scaleMax = 60;
  const range = scaleMax - BPI_MIN;
  return (
    <DashCard>
      <style dangerouslySetInnerHTML={{ __html: CHART_ANIMS }} />
      <h3 className="mb-4 text-xs font-bold uppercase text-bpim-muted">
        BPM帯域別BPI
      </h3>
      <div className="flex flex-col gap-2.5">
        {BPM_MOCK_DATA.map((row, i) => {
          const myColor = getBpiColorStyle(row.myBpi).bg;
          const rivalColor = getBpiColorStyle(row.rivalBpi).bg;
          const myWidth = ((row.myBpi - BPI_MIN) / range) * 100;
          const rivalWidth = ((row.rivalBpi - BPI_MIN) / range) * 100;
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="w-[60px] shrink-0 text-right text-[10px] font-bold text-bpim-muted">
                {row.label}
              </span>
              <div className="flex flex-1 flex-col gap-[3px]">
                <div
                  className="h-[9px] rounded-r-sm"
                  style={{
                    width: `${myWidth}%`,
                    backgroundColor: myColor,
                    animation: `growWidth 0.5s ease-out ${i * 0.07}s both`,
                  }}
                />
                <div
                  className="h-[9px] rounded-r-sm opacity-45"
                  style={{
                    width: `${rivalWidth}%`,
                    backgroundColor: rivalColor,
                    animation: `growWidth 0.5s ease-out ${i * 0.07 + 0.03}s both`,
                  }}
                />
              </div>
              <div className="w-[40px] shrink-0">
                <span
                  className="text-[11px] font-bold"
                  style={{ color: myColor }}
                >
                  {row.myBpi}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </DashCard>
  );
};

const MockBpiDistribution = () => {
  const maxCount = Math.max(...BPI_DIST_COUNTS);
  return (
    <DashCard>
      <style dangerouslySetInnerHTML={{ __html: CHART_ANIMS }} />
      <h3 className="mb-4 text-xs font-bold uppercase text-bpim-muted">
        BPI分布
      </h3>
      <div className="flex h-[140px] items-end justify-between gap-[3px] px-1">
        {BPI_DIST_MOCK.map((item, i) => {
          const color = getBpiColorStyle(item.bpi).bg;
          const heightPct = (BPI_DIST_COUNTS[i] / maxCount) * 100;
          return (
            <div key={i} className="flex flex-1 flex-col items-center">
              <div className="relative flex h-[110px] w-full flex-col justify-end">
                <div
                  className="w-full origin-bottom rounded-t-[2px]"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: color,
                    opacity: 0.85,
                    animation: `bounceGrow 0.6s ease-out ${i * 0.04}s both`,
                  }}
                />
              </div>
              <span
                className="mt-1 truncate text-[7px] font-bold text-bpim-muted"
                style={{ maxWidth: "100%" }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </DashCard>
  );
};

const SCORE_TABLE_MOCK = [
  {
    title: "AA",
    diff: "SPA",
    clearState: "HARD CLEAR",
    bpi: 63.2,
    djRank: "AAA",
  },
  {
    title: "Almagest",
    diff: "SPA",
    clearState: "EX HARD CLEAR",
    bpi: 72.4,
    djRank: "AAA",
  },
  {
    title: "嘆きの樹",
    diff: "SPA",
    clearState: "HARD CLEAR",
    bpi: 45.1,
    djRank: "AAA",
  },
  {
    title: "THE SAFARI",
    diff: "SPA",
    clearState: "CLEAR",
    bpi: 31.5,
    djRank: "AA+",
  },
  {
    title: "quell ~the seventh slave~",
    diff: "SPA",
    clearState: "CLEAR",
    bpi: 18.7,
    djRank: "AA",
  },
  {
    title: "MENDES",
    diff: "SPA",
    clearState: "FAILED",
    bpi: -8.3,
    djRank: "A",
  },
  { title: "冥", diff: "SPA", clearState: "CLEAR", bpi: 42.6, djRank: "AAA" },
];

const SCORE_BPI_DIST_MOCK = [
  { label: "<0", count: 12, bpi: -5 },
  { label: "0〜10", count: 38, bpi: 5 },
  { label: "10〜20", count: 47, bpi: 15 },
  { label: "20〜30", count: 41, bpi: 25 },
  { label: "30〜40", count: 33, bpi: 35 },
  { label: "40〜50", count: 24, bpi: 45 },
  { label: "50〜70", count: 18, bpi: 60 },
  { label: "70+", count: 9, bpi: 80 },
];

const LOGS_MOCK = [
  {
    date: "2025/03/28 22:14",
    totalBpi: 47.83,
    diff: 2.41,
    songCount: 12,
    topScores: [
      { title: "AA", bpi: 63.2 },
      { title: "Almagest", bpi: 72.4 },
      { title: "嘆きの樹", bpi: 45.1 },
      { title: "quell ~the seventh slave~", bpi: 18.7 },
    ],
  },
  {
    date: "2025/03/15 21:33",
    totalBpi: 45.42,
    diff: 3.11,
    songCount: 8,
    topScores: [
      { title: "THE SAFARI", bpi: 31.5 },
      { title: "冥", bpi: 42.6 },
      { title: "Verflucht", bpi: 29.1 },
      { title: "Lachryma《Re:Queen'M》", bpi: 54.8 },
    ],
  },
  {
    date: "2025/02/22 20:07",
    totalBpi: 42.31,
    diff: -0.58,
    songCount: 5,
    topScores: [
      { title: "perditus†paradisus", bpi: 38.9 },
      { title: "Lachryma《Re:Queen'M》", bpi: 54.8 },
    ],
  },
];

const RIVAL_ROWS = [
  { name: "ライバルA", win: 142, draw: 23, lose: 89, total: 254 },
  { name: "ライバルB", win: 98, draw: 31, lose: 125, total: 254 },
  { name: "ライバルC", win: 187, draw: 18, lose: 49, total: 254 },
];

const MockRivalBars = () => (
  <DashCard>
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-xs font-bold uppercase text-bpim-muted">
        ライバル比較
      </h3>
      <div className="flex items-center gap-3 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-sm bg-bpim-primary" />
          <span className="text-bpim-primary">WIN</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-sm bg-bpim-overlay" />
          <span className="text-bpim-muted">DRAW</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-sm bg-bpim-danger" />
          <span className="text-bpim-danger">LOSE</span>
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-4">
      {RIVAL_ROWS.map((r, idx) => {
        const winRate = (r.win / r.total) * 100;
        const drawRate = (r.draw / r.total) * 100;
        const loseRate = (r.lose / r.total) * 100;
        return (
          <div key={idx} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-bpim-text">{r.name}</span>
              <span className="text-[10px] text-bpim-muted">
                {r.total}曲比較
              </span>
            </div>
            <div className="relative h-[18px] w-full overflow-hidden rounded-sm bg-bpim-surface-2/60">
              <div className="flex h-full w-full">
                <div
                  className="relative h-full bg-bpim-primary"
                  style={{ width: `${winRate}%` }}
                >
                  {winRate > 10 && (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-[10px] font-bold text-white">
                        {r.win}
                      </span>
                    </div>
                  )}
                </div>
                <div
                  className="relative h-full bg-bpim-overlay"
                  style={{ width: `${drawRate}%` }}
                />
                <div
                  className="relative h-full flex-1 bg-bpim-danger"
                  style={{ width: `${loseRate}%` }}
                >
                  {loseRate > 10 && (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-[10px] font-bold text-white">
                        {r.lose}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </DashCard>
);

const MockActivityCalendar = () => (
  <DashCard>
    <p className="mb-4 text-xs font-bold text-bpim-muted">最近の更新</p>
    <div className="overflow-hidden">
      <div
        style={{
          display: "grid",
          gridTemplateRows: "repeat(7, 11px)",
          gridTemplateColumns: "repeat(20, 11px)",
          gridAutoFlow: "column",
          gap: "3px",
        }}
      >
        {ACTIVITY_MOCK.map((level, i) => (
          <div
            key={i}
            className="rounded-[2px]"
            style={{
              width: 11,
              height: 11,
              backgroundColor: ACTIVITY_COLORS[level],
            }}
          />
        ))}
      </div>
    </div>
    <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-bpim-muted">
      <span>Less</span>
      {[0, 1, 2, 3, 4].map((v) => (
        <div
          key={v}
          className="h-[10px] w-[10px] rounded-[2px]"
          style={{ backgroundColor: ACTIVITY_COLORS[v] }}
        />
      ))}
      <span>More</span>
    </div>
  </DashCard>
);

// ─── Showcase section layout ─────────────────────────────────────────────────

const ShowcaseSection = ({
  tag,
  title,
  children,
  visual,
  flip = false,
}: {
  tag: string;
  title: string;
  children: React.ReactNode;
  visual: React.ReactNode;
  flip?: boolean;
}) => (
  <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-5 lg:gap-14">
    <div
      className={cn(
        "flex flex-col gap-4 lg:col-span-2",
        flip && "lg:order-last",
      )}
    >
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-bpim-primary">
        {tag}
      </span>
      <h3 className="text-xl font-bold leading-snug text-bpim-text md:text-2xl">
        {title}
      </h3>
      <div className="space-y-2 text-sm leading-relaxed text-bpim-muted">
        {children}
      </div>
    </div>
    <div className={cn("lg:col-span-3", flip && "lg:order-first")}>
      {visual}
    </div>
  </div>
);

// ─── API / Privacy standalone sections ───────────────────────────────────────

const ApiSection = () => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-3">
      <div className="flex shrink-0 items-center justify-center rounded-lg bg-bpim-primary/10 p-2.5 text-bpim-primary">
        <Wrench className="h-5 w-5" />
      </div>
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-bpim-primary">
          Developer API
        </span>
        <h3 className="text-xl font-bold leading-snug text-bpim-text md:text-2xl">
          REST API
        </h3>
      </div>
    </div>
    <p className="text-sm leading-relaxed text-bpim-muted">
      BPIM2 はREST APIを一般公開しています。
      <br />
      自分のスコアデータや、公開状態のライバルのデータを外部から自由に取得・分析できます。
    </p>
    <div className="rounded-lg border border-bpim-border bg-bpim-surface px-4 py-3 font-mono text-[11px] text-bpim-muted">
      <span className="text-bpim-primary">GET</span>
      {" /api/v1/users/:userId/scores"}
      <br />
      <span className="text-bpim-primary">GET</span>
      {" /api/v1/users/:userId/stats/bpi"}
      <br />
      <span className="text-bpim-primary">GET</span>
      {" /api/v1/users/:userId/rivals"}
    </div>
  </div>
);

const PrivacySection = () => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-3">
      <div className="flex shrink-0 items-center justify-center rounded-lg bg-bpim-primary/10 p-2.5 text-bpim-primary">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-bpim-primary">
          Privacy Control
        </span>
        <h3 className="text-xl font-bold leading-snug text-bpim-text md:text-2xl">
          プライバシーコントロール
        </h3>
      </div>
    </div>
    <p className="text-sm leading-relaxed text-bpim-muted">
      スコアの公開状態は完全にユーザーが制御できます。非公開設定にすればAPIやライバル検索にも一切表示されません。安心して自身のデータに集中できます。
    </p>
    <div className="flex flex-col gap-2">
      {[
        { label: "公開", active: true },
        { label: "非公開", active: false },
      ].map(({ label, active }) => (
        <div
          key={label}
          className={cn(
            "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[12px]",
            active
              ? "border-bpim-primary/40 bg-bpim-primary/5 font-bold text-bpim-primary"
              : "border-bpim-border bg-bpim-surface text-bpim-muted",
          )}
        >
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              active ? "bg-bpim-primary" : "bg-bpim-overlay",
            )}
          />
          {label}
        </div>
      ))}
    </div>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <DashboardLayout>
      <Meta
        title=""
        description="beatmania IIDX 上級者のためのスコアマネジメントツール"
      />
      <div className="min-h-screen bg-bpim-bg py-16 text-bpim-text">
        <PageContainer>
          {/* ── Hero ── */}
          <div className="flex flex-col items-center gap-6 text-center">
            <h1 className="bg-gradient-to-br from-bpim-text to-gray-600 bg-clip-text text-6xl font-bold tracking-tighter text-transparent leading-none md:text-8xl">
              BPIM2
            </h1>
            <p className="max-w-2xl text-base text-bpim-muted md:text-lg">
              beatmania IIDX 上級者のためのスコアマネジメントツール
            </p>
          </div>

          {/* ── Login ── */}
          <div className="my-10">
            <LoginSection />
          </div>

          <Separator className="mb-20 bg-bpim-overlay/60" />

          {/* ── BPIとは？ ── */}
          <BpiExplainSection />

          <Separator className="my-20 bg-bpim-overlay/30" />

          {/* ── Showcase 1: BPI成長 ── */}
          <ShowcaseSection
            tag="TRACK YOUR GROWTH"
            title="成長の軌跡を辿る"
            visual={
              <div className="flex flex-col gap-4">
                <MockBpiHistoryChart />
                <MockCurrentBpiCard />
              </div>
            }
          >
            <p>
              BPIM2では☆11・☆12全楽曲のスコア更新及び、☆12に基づく総合BPIが記録されます。
              <br />
              いつ・どれだけ成長したか、過去に遡って振り返ることも可能です。
            </p>
            <p>
              また、総合BPIに基づき、今自分が全プレイヤーの中でどの水準にいるか、推定順位を確認することもできます。
            </p>
          </ShowcaseSection>

          <Separator className="my-20 bg-bpim-overlay/30" />

          {/* ── Showcase 2: 弱点分析 ── */}
          <ShowcaseSection
            tag="ANALYZE YOUR WEAKNESS"
            title="自分の得意分野を分析する"
            flip
            visual={
              <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
                <MockRadarChart />
                <MockBpmBars />
              </div>
            }
          >
            <p>
              NOTES・CHORD・PEAK・CHARGE・SCRATCH・SOFLANの6属性それぞれのBPIをレーダーチャートで可視化。自分の得意・苦手な譜面傾向が明らかになります。
            </p>
            <p>
              BPM帯域別のBPI分布も確認可能。高速・中速・低速・ソフランなど、ピンポイントで強化すべき領域がわかります。
            </p>
            <p>
              フォロー中のライバルと得意分野のチャートを重ねて、強み・弱みを比較することもできます。
            </p>
          </ShowcaseSection>

          <Separator className="my-20 bg-bpim-overlay/30" />

          {/* ── Showcase 3: BPI分布 ── */}
          <ShowcaseSection
            tag="SCORE DISTRIBUTION"
            title="スコア / BPI分布"
            visual={
              <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
                <MockBpiDistribution />
                <MockActivityCalendar />
              </div>
            }
          >
            <p>
              BPIやDJランクの分布を分かりやすく視覚化します。「BPI 20〜30
              の曲が最も多い」「0以下がまだ残っている」など、現在の実力分布が直感的にわかります。
            </p>
            <p>
              プレーの活動カレンダーも記録され、日別の記録を振り返ることができます。
            </p>
          </ShowcaseSection>

          <Separator className="my-20 bg-bpim-overlay/30" />

          {/* ── Showcase 4: ライバル機能 ── */}
          <ShowcaseSection
            tag="RIVAL TRACKING"
            title="コーナーで差をつけろ"
            flip
            visual={<MockRivalBars />}
          >
            <p>
              実力が近いプレイヤーを見つけて、無制限にフォローすることができます。
            </p>
            <p>
              フォローしたライバルから日々のスコア更新の通知を受け取って切磋琢磨できるほか、
              スコアの比較や、追いつき・引き離しも一目で把握できます。
            </p>
          </ShowcaseSection>

          <Separator className="my-20 bg-bpim-overlay/30" />

          {/* ── API / Privacy ── */}
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <ApiSection />
            <PrivacySection />
          </div>
        </PageContainer>
      </div>
    </DashboardLayout>
  );
}
