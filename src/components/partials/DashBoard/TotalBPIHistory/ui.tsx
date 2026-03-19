import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Rectangle,
} from "recharts";
import { BpiHistoryItem } from "@/hooks/stats/useTotalBPIHistory";
import { TotalBpiHistorySkeleton } from "@/components/partials/DashBoard/TotalBPIHistory/skeleton";
import { DashCard } from "@/components/ui/dashcard";
import { cn } from "@/lib/utils";
import { useChartColors } from "@/hooks/common/useChartColors";

const UpdateBar = (props: any) => {
  const { payload, primaryColor } = props;
  if (payload.rivalBpi !== undefined) return null;
  const fill = payload.updateCount > 0 ? primaryColor : "transparent";
  return (
    <Rectangle {...props} fill={fill} opacity={0.3} radius={[2, 2, 0, 0]} />
  );
};

const HistoryTooltip = ({ active, payload, label, myName, rivalName }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const isComparison = data.rivalBpi !== undefined;

  return (
    <div className="min-w-[200px] max-w-[300px] rounded-md border border-bpim-border bg-bpim-surface p-3 shadow-xl">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-bold text-bpim-muted">{label}</p>

        {isComparison ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-bpim-primary">
                {myName}
              </span>
              <span className="font-mono text-sm font-bold text-bpim-primary">
                {data.myBpi?.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-bpim-warning">
                {rivalName}
              </span>
              <span className="font-mono text-sm font-bold text-bpim-warning">
                {data.rivalBpi?.toFixed(2)}
              </span>
            </div>
            <div className="my-1 h-px w-full bg-bpim-overlay/60" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-bpim-muted">差分</span>
              <span
                className={cn(
                  "font-mono text-xs font-bold",
                  data.myBpi - data.rivalBpi > 0
                    ? "text-bpim-success"
                    : "text-bpim-danger",
                )}
              >
                {data.myBpi - data.rivalBpi > 0 ? "+" : ""}
                {(data.myBpi - data.rivalBpi).toFixed(2)}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-bold text-bpim-primary">
                総合BPI: {data.myBpi?.toFixed(2)}
              </p>
              <span className="text-[10px] text-bpim-muted">
                累計: {data.count}曲
              </span>
            </div>
            {data.updateCount > 0 && (
              <>
                <div className="my-2 h-px w-full bg-bpim-overlay/60" />
                <p className="text-[10px] font-bold text-bpim-success">
                  UPDATED: {data.updateCount} items
                </p>
                <div className="max-h-[120px] w-full overflow-y-auto pr-1">
                  {data.updatedSongs?.map((song: string, idx: number) => (
                    <p key={idx} className="text-[10px] text-bpim-text/70">
                      • {song}
                    </p>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface UnifiedBpiHistoryChartProps {
  myData?: BpiHistoryItem[];
  rivalData?: BpiHistoryItem[];
  isLoading: boolean;
  myName?: string;
  rivalName?: string;
}

export const TotalBpiHistoryChart = ({
  myData,
  rivalData,
  isLoading,
  myName = "自分",
  rivalName = "ライバル",
}: UnifiedBpiHistoryChartProps) => {
  const c = useChartColors();

  const { chartData, ticks, startIndex } = useMemo(() => {
    if (!myData && !rivalData)
      return { chartData: [], ticks: [], startIndex: 0 };

    const dateSet = new Set<string>();
    myData?.forEach((d) => dateSet.add(d.date));
    rivalData?.forEach((d) => dateSet.add(d.date));
    const allDates = Array.from(dateSet).sort();

    const myMap = new Map(myData?.map((d) => [d.date, d]));
    const rivalMap = new Map(rivalData?.map((d) => [d.date, d]));

    let lastMy: any = null;
    let lastRival: any = null;

    const merged = allDates.map((date) => {
      const myEntry = myMap.get(date);
      const rivalEntry = rivalMap.get(date);
      if (myEntry) lastMy = myEntry;
      if (rivalEntry) lastRival = rivalEntry;

      return {
        date,
        myBpi: myEntry?.totalBpi ?? lastMy?.totalBpi,
        rivalBpi: rivalData
          ? (rivalEntry?.totalBpi ?? lastRival?.totalBpi)
          : undefined,
        updateCount: myEntry?.updatedSongs?.length || 0,
        updatedSongs: myEntry?.updatedSongs || [],
        count: myEntry?.count || lastMy?.count,
      };
    });

    const interval = Math.max(1, Math.floor(merged.length / 10));
    const calculatedTicks = merged
      .filter((_, i) => i % interval === 0 || i === merged.length - 1)
      .map((d) => d.date);

    return {
      chartData: merged,
      ticks: calculatedTicks,
      startIndex: Math.max(0, merged.length - 30),
    };
  }, [myData, rivalData]);

  if (isLoading) return <TotalBpiHistorySkeleton />;
  if (chartData.length === 0) return null;

  const formatDate = (value: string, index: number) => {
    const date = new Date(value);
    return index === 0 ||
      date.getFullYear() !== new Date(ticks[index - 1]).getFullYear()
      ? `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
      : `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <DashCard className="h-[420px]">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase text-bpim-muted">
          総合BPI推移
        </h3>
        {rivalData && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-[2px] w-3 bg-bpim-primary" />
              <span className="text-xs font-medium text-bpim-primary">
                {myName}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-[2px] w-3 border-t-2 border-dashed border-bpim-warning bg-transparent" />
              <span className="text-xs font-medium text-bpim-warning">
                {rivalName}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="h-[80%] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={c.muted}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              ticks={ticks}
              tickFormatter={formatDate}
              stroke={c.muted}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={["dataMin - 1", "dataMax + 1"]}
              stroke={c.muted}
              fontSize={10}
              tickFormatter={(v) => v.toFixed(1)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis yAxisId="right" hide />

            <Tooltip
              content={<HistoryTooltip myName={myName} rivalName={rivalName} />}
              cursor={{ stroke: c.grid }}
            />

            {!rivalData && (
              <Bar
                yAxisId="right"
                dataKey="updateCount"
                barSize={4}
                shape={<UpdateBar primaryColor={c.primary} />}
              />
            )}

            <Line
              type="monotone"
              dataKey="myBpi"
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
              animationDuration={1000}
            />

            {rivalData && (
              <Line
                type="monotone"
                dataKey="rivalBpi"
                stroke={c.warning}
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                connectNulls
                animationDuration={1200}
              />
            )}

            <Brush
              dataKey="date"
              height={30}
              stroke={c.grid}
              fill={c.surface}
              startIndex={startIndex}
              tickFormatter={() => ""}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </DashCard>
  );
};
