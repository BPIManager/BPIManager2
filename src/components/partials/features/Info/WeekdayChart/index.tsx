import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DashCard } from "@/components/ui/dashcard";
import { useChartColors } from "@/hooks/common/useChartColors";
import PeriodTabs from "../PeriodTabs";
import type { SiteStatsPeriod, WeekdayEntry } from "@/types/siteStats";
import { useTranslation } from "@/hooks/common/useTranslation";

/** weekday は 1=日曜 〜 7=土曜。2024-01-07 は日曜日 */
const weekdayLabel = (locale: string, weekday: number) =>
  new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, 0, 6 + weekday)),
  );

function WeekdayChart({
  data,
}: {
  data: Record<SiteStatsPeriod, WeekdayEntry[]>;
}) {
  const c = useChartColors();
  const { t, locale } = useTranslation();
  const [period, setPeriod] = useState<SiteStatsPeriod>("d7");

  const chartData = data[period].map((d) => ({
    ...d,
    label: weekdayLabel(locale, d.weekday),
  }));

  return (
    <DashCard className="h-80 flex flex-col">
      <div className="mb-3 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-bold uppercase text-bpim-muted">
          {t("siteInfo.weekday.title")}
        </h3>
        <PeriodTabs value={period} onChange={setPeriod} />
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 15, right: -30, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={c.grid}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke={c.muted}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              stroke={c.warning}
              fontSize={9}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke={c.primary}
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
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar
              yAxisId="left"
              dataKey="allScores"
              name={t("siteInfo.series.allScores")}
              fill={c.warning}
              opacity={0.85}
              radius={[2, 2, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey="logs"
              name={t("siteInfo.series.batchLogs")}
              fill={c.primary}
              opacity={0.85}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashCard>
  );
}

export default WeekdayChart;
