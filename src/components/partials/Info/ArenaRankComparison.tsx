import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DashCard } from "@/components/ui/dashcard";
import { useChartColors } from "@/hooks/common/useChartColors";
import { useOfficialArena } from "@/hooks/siteStats/useOfficialArena";
import type { ArenaRankEntry } from "@/types/siteStats";

type Mode = "self" | "official";

export function ArenaRankComparison({
  selfReported,
}: {
  selfReported: ArenaRankEntry[];
}) {
  const c = useChartColors();
  const [mode, setMode] = useState<Mode>("self");
  const { data: official, isLoading, isError } = useOfficialArena();

  const chartData =
    mode === "self"
      ? selfReported
      : (official?.distribution ?? []);

  const subtitle =
    mode === "official" && official
      ? `照合済み ${official.totalMatched.toLocaleString()} 人 / 公式ランキング ${official.totalPlayers.toLocaleString()} 人`
      : null;

  return (
    <DashCard className="h-80 flex flex-col">
      <div className="mb-3 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-sm font-bold uppercase text-bpim-muted">
            アリーナランク別登録者数
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-[10px] text-bpim-muted">{subtitle}</p>
          )}
        </div>
        <div className="flex overflow-hidden rounded border border-bpim-border text-[10px]">
          {(["self", "official"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2 py-0.5 transition-colors ${
                mode === m
                  ? "bg-bpim-primary text-bpim-surface"
                  : "text-bpim-muted hover:bg-bpim-overlay"
              }`}
            >
              {m === "self" ? "自己申告" : "実データ"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {mode === "official" && isLoading ? (
          <div className="flex h-full items-center justify-center text-xs text-bpim-muted">
            読み込み中...
          </div>
        ) : mode === "official" && isError ? (
          <div className="flex h-full items-center justify-center text-xs text-bpim-muted">
            公式データが未生成です。EAGATE_COOKIE を設定してcronを実行してください。
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={c.grid}
                horizontal={false}
              />
              <XAxis
                type="number"
                stroke={c.muted}
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="rank"
                width={60}
                stroke={c.muted}
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: c.surface,
                  border: `1px solid ${c.grid}`,
                  borderRadius: 6,
                  fontSize: 11,
                }}
              />
              <Bar
                dataKey="count"
                name="登録者数"
                fill={mode === "official" ? c.success : c.primary}
                radius={[0, 2, 2, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </DashCard>
  );
}
