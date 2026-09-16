import { DashCard } from "@/components/ui/dashcard";
import { useChartColors } from "@/hooks/common/useChartColors";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { useTranslation } from "@/hooks/common/useTranslation";
import { RADAR_MOCK_DATA } from "../mocks";

export const MockRadarChart = () => {
  const c = useChartColors();
  const { t } = useTranslation();

  return (
    <DashCard>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-bpim-muted">
          {t("login.showcase.weakness.radarTitle")}
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-0.5 w-3 bg-bpim-primary" />
            <span className="text-[10px] text-bpim-primary">
              {t("login.showcase.weakness.me")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-0.5 w-3 border-t-2 border-dashed border-bpim-warning" />
            <span className="text-[10px] text-bpim-warning">
              {t("login.showcase.weakness.rival")}
            </span>
          </div>
        </div>
      </div>
      <div className="h-55">
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
