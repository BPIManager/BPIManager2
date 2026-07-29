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

export function ArenaRankChart({ data }: { data: { rank: string; count: number }[] }) {
  const c = useChartColors();
  return (
    <DashCard className="h-80 flex flex-col">
      <h3 className="mb-3 text-sm font-bold uppercase text-bpim-muted shrink-0">
        アリーナランク別登録者数
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
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
            <Bar dataKey="count" name="登録者数" fill={c.primary} radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashCard>
  );
}
