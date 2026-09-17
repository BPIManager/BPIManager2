import { DashCard } from "@/components/ui/dashcard";
import { useChartColors } from "@/hooks/common/useChartColors";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "@/hooks/common/useTranslation";
import { BPI_HISTORY_MOCK } from "../mocks";

export const MockBpiHistoryChart = () => {
  const c = useChartColors();
  const { t } = useTranslation();

  return (
    <DashCard className="h-65">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-bpim-muted">
          {t("login.showcase.growth.chartTitle")}
        </h3>
      </div>
      <div className="h-48.75">
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
