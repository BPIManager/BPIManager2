import {
  PieChart,
  Pie,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import type { ChartData } from "@/types/ui/chart";

const PieTooltipContent = ({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
  total: number;
}) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const percent = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="rounded-md border border-bpim-border bg-bpim-surface px-2 py-1 text-xs shadow">
      <span className="font-bold">{name}</span>
      <span className="ml-2 text-bpim-muted">
        {value} ({percent.toFixed(1)}%)
      </span>
    </div>
  );
};

const DistributionPie = ({
  data,
  getColor,
  label,
  labelColor,
}: {
  data: ChartData[];
  getColor: (label: string) => string;
  label: string;
  labelColor: string;
}) => {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const filtered = [...data]
    .reverse()
    .filter((d) => d.count > 0)
    .map((d) => ({ ...d, fill: getColor(d.label) }));
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie
            data={filtered}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius="40%"
            outerRadius="100%"
            paddingAngle={2}
            startAngle={90}
            endAngle={-270}
          />
          <RechartsTooltip content={<PieTooltipContent total={total} />} />
        </PieChart>
      </ResponsiveContainer>
      <span className="text-xs font-bold" style={{ color: labelColor }}>
        {label}
      </span>
    </div>
  );
};

export default DistributionPie;
