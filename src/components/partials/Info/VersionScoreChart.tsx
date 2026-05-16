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
import type { VersionScoreDistribution } from "@/types/siteStats";

export function VersionScoreChart({ data }: { data: VersionScoreDistribution }) {
  const c = useChartColors();

  return (
    <DashCard className="flex flex-col">
      <div className="mb-3 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-bold uppercase text-bpim-muted">
          バージョン別スコア登録数
        </h3>
        <span className="text-[10px] text-bpim-muted">
          全{data.total.toLocaleString()}件
        </span>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.versions}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
            <XAxis
              type="number"
              stroke={c.muted}
              fontSize={9}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                v >= 1_000_000
                  ? `${(v / 1_000_000).toFixed(1)}M`
                  : v >= 1_000
                  ? `${(v / 1_000).toFixed(0)}K`
                  : String(v)
              }
            />
            <YAxis
              type="category"
              dataKey="version"
              width={28}
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
              formatter={(v) => [Number(v).toLocaleString(), "スコア数"]}
            />
            <Bar
              dataKey="count"
              name="スコア数"
              fill={c.primary}
              radius={[0, 2, 2, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashCard>
  );
}
