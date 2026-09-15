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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashCard } from "@/components/ui/dashcard";
import { useChartColors } from "@/hooks/common/useChartColors";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { versionsNonDisabledCollection } from "@/constants/iidx/versionTitles";
import type { TotalBpiHistogramBucket } from "@/types/siteStats";

function TotalBpiHistogramChart({
  data,
}: {
  data: Record<string, TotalBpiHistogramBucket[]> | undefined;
}) {
  const c = useChartColors();
  // cronが未再生成のstats.jsonにはこのキー自体が無いことがあるため、型上は必須でも
  // 実行時は無いものとして扱う
  const histogramByVersion = data ?? {};
  const availableVersions = versionsNonDisabledCollection.filter(
    (v) => histogramByVersion[v.value]?.some((b) => b.count > 0),
  );
  const [version, setVersion] = useState<string>(
    histogramByVersion[latestVersion]
      ? latestVersion
      : (availableVersions[0]?.value ?? latestVersion),
  );

  const buckets = histogramByVersion[version] ?? [];
  const total = buckets.reduce((s, b) => s + b.count, 0);
  const chartData = buckets.map((b) => ({
    ...b,
    label: `${b.bucketStart}`,
  }));

  return (
    <DashCard className="flex flex-col">
      <div className="mb-3 flex items-center justify-between shrink-0 gap-2">
        <h3 className="text-sm font-bold uppercase text-bpim-muted">
          総合BPI分布
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-bpim-muted">
            全{total.toLocaleString()}人
          </span>
          <Select value={version} onValueChange={setVersion}>
            <SelectTrigger className="h-7 w-28 border-bpim-border bg-bpim-surface-2/60 text-xs hover:bg-bpim-overlay focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-bpim-border bg-bpim-bg">
              {versionsNonDisabledCollection.map((v) => (
                <SelectItem key={v.value} value={v.value} className="text-xs">
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
            <XAxis
              dataKey="label"
              stroke={c.muted}
              fontSize={9}
              tickLine={false}
              axisLine={false}
              interval={1}
            />
            <YAxis stroke={c.muted} fontSize={9} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: c.surface,
                border: `1px solid ${c.grid}`,
                borderRadius: 6,
                fontSize: 11,
              }}
              labelFormatter={(_, payload) => {
                const b = payload?.[0]?.payload as TotalBpiHistogramBucket | undefined;
                return b ? `${b.bucketStart}〜${b.bucketEnd}` : "";
              }}
              formatter={(v) => [Number(v).toLocaleString(), "人数"]}
            />
            <Bar dataKey="count" name="人数" fill={c.primary} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashCard>
  );
}

export default TotalBpiHistogramChart;
