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
import { LottieAnimation } from "@/components/ui/lottie-animation";
import ghostAnimation from "@/assets/lottie/ghost.json";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: IidxTowerEntry[];
  showImportAlert?: boolean;
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

export const IidxTowerCard = ({ data, showImportAlert = true }: Props) => {
  const [showKey, setShowKey] = useState(true);
  const [showScratch, setShowScratch] = useState(true);
  const [periodDays, setPeriodDays] = useState<number>(30);
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

    const keySorted = [...filtered].sort((a, b) => b.keyCount - a.keyCount);
    const scrSorted = [...filtered].sort(
      (a, b) => b.scratchCount - a.scratchCount,
    );

    const keyRanks = new Map(keySorted.map((d, i) => [d.playDate, i + 1]));
    const scrRanks = new Map(scrSorted.map((d, i) => [d.playDate, i + 1]));

    return { filtered, latest, totals, max, keyRanks, scrRanks };
  }, [data, periodDays]);

  if (!processedData) {
    return (
      <DashCard className="border-2 border-dashed border-bpim-primary/30 bg-bpim-primary/5 p-6 text-center transition-all hover:border-bpim-primary/50">
        <div className="flex flex-col items-center">
          <div className="relative mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-bpim-primary/10">
            <LottieAnimation
              animationData={ghostAnimation}
              loop={true}
              size={36}
            />
          </div>
          <h3 className="text-base font-black text-bpim-text tracking-tight">
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

  const { filtered, latest, totals, max, keyRanks, scrRanks } = processedData;

  const chartData = filtered.map((d) => ({
    date: dayjs(d.playDate).format("MM/DD"),
    鍵盤: d.keyCount,
    スクラッチ: d.scratchCount,
  }));

  return (
    <DashCard>
      <div className="mb-4 flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-bpim-muted">
            最終プレー: {dayjs(latest.playDate).format("YYYY/MM/DD")}
          </p>
          <div className="flex gap-4">
            <div>
              <p className="text-[9px] text-bpim-subtle">鍵盤</p>
              <div className="flex items-baseline gap-1">
                <p className="text-lg font-black leading-none text-bpim-primary">
                  {fmt(latest.keyCount)}
                </p>
                <p className="text-[9px] opacity-60 text-bpim-primary">
                  #{keyRanks.get(latest.playDate)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-bpim-subtle">スクラッチ</p>
              <div className="flex items-baseline gap-1">
                <p className="text-lg font-black leading-none text-bpim-warning">
                  {fmt(latest.scratchCount)}
                </p>
                <p className="text-[9px] opacity-60 text-bpim-warning">
                  #{scrRanks.get(latest.playDate)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPeriodDays(p.days)}
              className={`rounded px-2 py-1 text-[10px] font-bold transition-colors ${
                periodDays === p.days
                  ? "bg-bpim-primary text-white"
                  : "bg-bpim-surface-2 text-bpim-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-px bg-bpim-border overflow-hidden rounded-lg border border-bpim-border">
        <div className="bg-bpim-surface-2 p-2 text-center">
          <p className="text-[9px] text-bpim-subtle uppercase">鍵盤累計</p>
          <p className="text-sm font-bold text-bpim-text">{fmt(totals.key)}</p>
        </div>
        <div className="bg-bpim-surface-2 p-2 text-center">
          <p className="text-[9px] text-bpim-subtle uppercase">
            スクラッチ累計
          </p>
          <p className="text-sm font-bold text-bpim-text">
            {fmt(totals.scratch)}
          </p>
        </div>
      </div>

      <div className="h-40 -mx-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: showScratch ? 40 : 15,
              left: 15,
              bottom: 0,
            }}
          >
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: "var(--color-bpim-subtle)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fontSize: 9, fill: "var(--color-bpim-subtle)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
              }
              width={30}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 9, fill: "var(--color-bpim-subtle)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
              }
              width={30}
            />
            <Tooltip
              allowEscapeViewBox={{ x: false, y: true }}
              contentStyle={{
                backgroundColor: "var(--color-bpim-surface-2)",
                border: "1px solid var(--color-bpim-border)",
                borderRadius: "8px",
                fontSize: "11px",
                padding: "8px 12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
              }}
              labelStyle={{
                color: "var(--color-bpim-text)",
                fontWeight: "bold",
                marginBottom: "4px",
              }}
              itemStyle={{
                padding: "0",
                color: "var(--color-bpim-text)",
              }}
              formatter={(value: any, name: any) => [
                <span key="val" className="font-bold">
                  {fmt(Number(value))}
                </span>,
                name,
              ]}
              cursor={{ fill: "var(--color-bpim-border)", opacity: 0.1 }}
            />
            {showKey && (
              <Bar
                yAxisId="left"
                dataKey="鍵盤"
                fill="var(--color-bpim-primary)"
                radius={[2, 2, 0, 0]}
                barSize={16}
              />
            )}
            {showScratch && (
              <Bar
                yAxisId="right"
                dataKey="スクラッチ"
                fill="var(--color-bpim-warning)"
                radius={[2, 2, 0, 0]}
                barSize={16}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showKey}
              onChange={() => setShowKey(!showKey)}
              className="hidden"
            />
            <span
              className={`w-2 h-2 rounded-full ${showKey ? "bg-bpim-primary" : "bg-bpim-border"}`}
            />
            <span className="text-[10px] text-bpim-muted">鍵盤</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showScratch}
              onChange={() => setShowScratch(!showScratch)}
              className="hidden"
            />
            <span
              className={`w-2 h-2 rounded-full ${showScratch ? "bg-bpim-warning" : "bg-bpim-border"}`}
            />
            <span className="text-[10px] text-bpim-muted">スクラッチ</span>
          </label>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 rounded-full bg-bpim-surface-3 px-3 py-1 text-[10px] text-bpim-text hover:brightness-110 transition-all"
        >
          {isExpanded ? "詳細を隠す" : "日別ランキングを表示"}
          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 overflow-hidden rounded-lg border border-bpim-border">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-bpim-surface-3 text-bpim-subtle uppercase text-[9px]">
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
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-3 py-2 font-mono text-bpim-muted">
                    {dayjs(day.playDate).format("MM/DD")}
                  </td>

                  <td
                    className="px-3 py-2 text-right"
                    style={getIntensityStyle(day.keyCount, max.key, "key")}
                  >
                    <div className="inline-flex items-baseline gap-1">
                      <span className="font-bold tabular-nums">
                        {fmt(day.keyCount)}
                      </span>
                      <span className="w-7 text-left text-[9px] opacity-60 font-normal">
                        #{keyRanks.get(day.playDate)}
                      </span>
                    </div>
                  </td>

                  <td
                    className="px-3 py-2 text-right"
                    style={getIntensityStyle(day.scratchCount, max.scr, "scr")}
                  >
                    <div className="inline-flex items-baseline gap-1">
                      <span className="font-bold tabular-nums">
                        {fmt(day.scratchCount)}
                      </span>
                      <span className="w-7 text-left text-[9px] opacity-60 font-normal">
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
            href={`/ranking/global?category=iidxTower&towerPeriod=month&towerDate=${dayjs().format("YYYY-MM-DD")}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-bpim-surface-2 px-3 py-2 text-[11px] font-bold text-bpim-text hover:brightness-110 transition-all"
          >
            <BarChart2 size={13} />
            ランキングを見る
          </Link>
          <Link
            href="/import?tab=tower"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-bpim-surface-2 px-3 py-2 text-[11px] font-bold text-bpim-text hover:brightness-110 transition-all"
          >
            <Download size={13} />
            データをインポート
          </Link>
        </div>
      )}
    </DashCard>
  );
};
