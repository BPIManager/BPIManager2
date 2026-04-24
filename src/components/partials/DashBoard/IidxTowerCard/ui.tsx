import { useState, useMemo } from "react";
import Link from "next/link";
import dayjs from "@/lib/dayjs";
import { DashCard } from "@/components/ui/dashcard";
import type { IidxTowerEntry } from "@/hooks/iidxTower/useIidxTower";
import {
  ChevronDown,
  ChevronUp,
  BarChart2,
  Download,
  Import,
} from "lucide-react";
import { LordiconAnimation } from "@/components/ui/lordicon-animation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface Props {
  data: IidxTowerEntry[];
  showImportAlert?: boolean;
  defaultPeriod?: number;
}

const fmt = (n: number) => n.toLocaleString("ja-JP");

const PERIODS = [
  { label: "7日", days: 7 },
  { label: "30日", days: 30 },
  { label: "90日", days: 90 },
  { label: "全期間", days: 0 },
] as const;

const getIntensityStyle = (value: number, max: number, type: "key" | "scr") => {
  if (max === 0) return {};
  const ratio = value / max;
  const opacity = 0.3 + ratio * 0.7;
  const color =
    type === "key"
      ? `rgba(59, 130, 246, ${opacity})`
      : `rgba(245, 158, 11, ${opacity})`;
  return { color };
};

export const IidxTowerCard = ({
  data,
  showImportAlert = true,
  defaultPeriod = 30,
}: Props) => {
  const [periodDays, setPeriodDays] = useState<number>(defaultPeriod);
  const [isExpanded, setIsExpanded] = useState(false);

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const sorted = [...data].sort((a, b) =>
      a.playDate.localeCompare(b.playDate),
    );
    const filtered =
      periodDays === 0
        ? sorted
        : sorted.filter((d) =>
            dayjs(d.playDate).isAfter(dayjs().subtract(periodDays, "day")),
          );

    const latest = sorted[sorted.length - 1];

    const totals = {
      key: sorted.reduce((s, d) => s + d.keyCount, 0),
      scratch: sorted.reduce((s, d) => s + d.scratchCount, 0),
    };

    const max = {
      key: Math.max(...filtered.map((d) => d.keyCount), 1),
      scr: Math.max(...filtered.map((d) => d.scratchCount), 1),
    };

    const scratchScale = max.key > 0 && max.scr > 0 ? max.key / max.scr : 1;

    const chartData = filtered.map((d) => ({
      date: dayjs(d.playDate).format("MM/DD"),
      key: d.keyCount,
      scr: d.scratchCount > 0 ? -(d.scratchCount * scratchScale) : 0,
      rawScr: d.scratchCount,
    }));

    const keySorted = [...filtered].sort((a, b) => b.keyCount - a.keyCount);
    const scrSorted = [...filtered].sort(
      (a, b) => b.scratchCount - a.scratchCount,
    );

    const keyRanks = new Map(keySorted.map((d, i) => [d.playDate, i + 1]));
    const scrRanks = new Map(scrSorted.map((d, i) => [d.playDate, i + 1]));

    return {
      filtered,
      latest,
      totals,
      max,
      keyRanks,
      scrRanks,
      chartData,
      scratchScale,
    };
  }, [data, periodDays]);

  if (!processedData) {
    return (
      <DashCard className="border-2 border-dashed border-bpim-primary/30 bg-bpim-primary/5 p-6 text-center transition-all hover:border-bpim-primary/50">
        <div className="flex flex-col items-center">
          <div className="relative mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-bpim-primary/10">
            <LordiconAnimation src="/lottie/ghost.json" trigger="loop" size={36} />
          </div>
          <h3 className="text-base font-black tracking-tight text-bpim-text">
            IIDXタワーのデータがありません
          </h3>
          <p className="mt-2 max-w-full text-xs leading-relaxed text-bpim-muted">
            データをインポートすると、鍵盤・スクラッチの打鍵数推移を確認できます。
            <br />
            他のユーザーと鍵盤をシバいた数のランキング表示も可能です。
          </p>
          {showImportAlert && (
            <Link
              href="/import?tab=tower"
              className="mt-5 flex items-center gap-2 rounded-lg bg-bpim-primary/10 px-2 py-2 text-xs font-bold text-bpim-primary transition-all hover:bg-bpim-primary/20"
            >
              <Import className="h-4 w-4" />
              インポート
            </Link>
          )}
        </div>
      </DashCard>
    );
  }

  const {
    filtered,
    latest,
    totals,
    max,
    keyRanks,
    scrRanks,
    chartData,
    scratchScale,
  } = processedData;

  const StatHeader = ({
    title,
    latestCount,
    rank,
    totalCount,
    textColorClass,
  }: {
    title: string;
    latestCount: number;
    rank: number;
    totalCount: number;
    textColorClass: string;
  }) => (
    <div className="flex flex-col justify-between">
      <div className="flex items-end justify-between">
        <div>
          <h4 className="mb-1 text-[10px] font-bold text-bpim-subtle">
            {title}
          </h4>
          <div className="flex items-baseline gap-2">
            <p className={`text-xl font-black leading-none ${textColorClass}`}>
              {fmt(latestCount)}
            </p>
            <p className={`text-[10px] opacity-70 ${textColorClass}`}>
              #{rank}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase text-bpim-subtle">期間累計</p>
          <p className="text-sm font-bold text-bpim-text">{fmt(totalCount)}</p>
        </div>
      </div>
    </div>
  );

  return (
    <DashCard>
      <div className="mb-4 flex items-start justify-between">
        <p className="mt-1 text-[10px] font-bold text-bpim-muted">
          最終プレー: {dayjs(latest.playDate).format("YYYY/MM/DD")}
        </p>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPeriodDays(p.days)}
              className={`rounded px-2 py-1 text-[10px] font-bold transition-colors ${
                periodDays === p.days
                  ? "bg-bpim-primary text-white"
                  : "bg-bpim-surface-2 text-bpim-muted hover:bg-bpim-surface-3"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 divide-x divide-bpim-border">
        <div className="pr-2">
          <StatHeader
            title="鍵盤"
            latestCount={latest.keyCount}
            rank={keyRanks.get(latest.playDate) || 0}
            totalCount={totals.key}
            textColorClass="text-bpim-primary"
          />
        </div>
        <div className="pl-4">
          <StatHeader
            title="スクラッチ"
            latestCount={latest.scratchCount}
            rank={scrRanks.get(latest.playDate) || 0}
            totalCount={totals.scratch}
            textColorClass="text-bpim-warning"
          />
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="h-48 -mx-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 15, left: 15, bottom: 0 }}
              stackOffset="sign"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--color-bpim-border)"
                strokeOpacity={0.4}
              />
              <ReferenceLine
                y={0}
                stroke="var(--color-bpim-text)"
                strokeWidth={1}
                strokeOpacity={0.3}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "var(--color-bpim-subtle)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "var(--color-bpim-subtle)" }}
                tickLine={false}
                axisLine={false}
                width={34}
                tickFormatter={(v) => {
                  if (v === 0) return "0";
                  if (v < 0) {
                    const unscaled = Math.abs(v) / scratchScale;
                    if (unscaled >= 1000) {
                      return `${(unscaled / 1000).toFixed(1).replace(/\.0$/, "")}k`;
                    }
                    return Math.round(unscaled).toString();
                  }
                  return v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString();
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-bpim-surface-2)",
                  border: "1px solid var(--color-bpim-border)",
                  borderRadius: "8px",
                  fontSize: "11px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                }}
                labelStyle={{
                  color: "var(--color-bpim-text)",
                  fontWeight: "bold",
                  marginBottom: "4px",
                }}
                formatter={(v: any, name: any, props: any) => {
                  const nameStr = String(name);
                  if (nameStr === "スクラッチ") {
                    return [
                      <span key="v" className="tabular-nums font-bold">
                        {fmt(props.payload.rawScr)}
                      </span>,
                      nameStr,
                    ];
                  }
                  return [
                    <span key="v" className="tabular-nums font-bold">
                      {fmt(Number(v))}
                    </span>,
                    nameStr,
                  ];
                }}
                cursor={{ fill: "var(--color-bpim-border)", opacity: 0.1 }}
              />
              <Bar
                dataKey="key"
                name="鍵盤"
                stackId="a"
                fill="var(--color-bpim-primary)"
                radius={[2, 2, 0, 0]}
                barSize={16}
              />
              <Bar
                dataKey="scr"
                name="スクラッチ"
                stackId="a"
                fill="var(--color-bpim-warning)"
                radius={[0, 0, 2, 2]}
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-2 flex items-center justify-end">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 rounded-full bg-bpim-surface-3 px-3 py-1 text-[10px] text-bpim-text transition-all hover:brightness-110"
        >
          {isExpanded ? "詳細を隠す" : "日別ランキングを表示"}
          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 overflow-hidden rounded-lg border border-bpim-border">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-bpim-surface-3 text-[9px] uppercase text-bpim-subtle">
              <tr>
                <th className="px-3 py-2 font-medium">日付</th>
                <th className="px-3 py-2 text-right font-medium">
                  鍵盤 (順位)
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  スクラッチ (順位)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bpim-border bg-bpim-surface-1">
              {[...filtered].reverse().map((day) => (
                <tr
                  key={day.playDate}
                  className="transition-colors hover:bg-white/5"
                >
                  <td className="px-3 py-2 font-mono text-bpim-muted">
                    {dayjs(day.playDate).format("MM/DD")}
                  </td>

                  <td
                    className="px-3 py-2 text-right"
                    style={getIntensityStyle(day.keyCount, max.key, "key")}
                  >
                    <div className="inline-flex items-baseline gap-1">
                      <span className="tabular-nums font-bold">
                        {fmt(day.keyCount)}
                      </span>
                      <span className="w-7 text-left text-[9px] font-normal opacity-60">
                        #{keyRanks.get(day.playDate)}
                      </span>
                    </div>
                  </td>

                  <td
                    className="px-3 py-2 text-right"
                    style={getIntensityStyle(day.scratchCount, max.scr, "scr")}
                  >
                    <div className="inline-flex items-baseline gap-1">
                      <span className="tabular-nums font-bold">
                        {fmt(day.scratchCount)}
                      </span>
                      <span className="w-7 text-left text-[9px] font-normal opacity-60">
                        #{scrRanks.get(day.playDate)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showImportAlert && (
        <div className="mt-4 flex gap-2">
          <Link
            href={`/ranking/global?category=iidxTower&towerPeriod=month&towerDate=${dayjs().format(
              "YYYY-MM-DD",
            )}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-bpim-surface-2 px-3 py-2 text-[11px] font-bold text-bpim-text transition-all hover:brightness-110"
          >
            <BarChart2 size={13} />
            ランキングを見る
          </Link>
          <Link
            href="/import?tab=tower"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-bpim-surface-2 px-3 py-2 text-[11px] font-bold text-bpim-text transition-all hover:brightness-110"
          >
            <Download size={13} />
            データをインポート
          </Link>
        </div>
      )}
    </DashCard>
  );
};
