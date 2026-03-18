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

const UpdateBar = (props: any) => {
  const { payload } = props;
  if (payload.rivalBpi !== undefined) return null;
  const fill = payload.updateCount > 0 ? "#3b82f6" : "transparent";
  return (
    <Rectangle {...props} fill={fill} opacity={0.3} radius={[2, 2, 0, 0]} />
  );
};

const HistoryTooltip = ({ active, payload, label, myName, rivalName }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const isComparison = data.rivalBpi !== undefined;

  return (
    <div className="min-w-[200px] max-w-[300px] rounded-md border border-white/20 bg-bpim-bg p-3 shadow-xl">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-bold text-gray-500">{label}</p>

        {isComparison ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400">{myName}</span>
              <span className="font-mono text-sm font-bold text-blue-400">
                {data.myBpi?.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-400">
                {rivalName}
              </span>
              <span className="font-mono text-sm font-bold text-orange-400">
                {data.rivalBpi?.toFixed(2)}
              </span>
            </div>
            <div className="my-1 h-px w-full bg-white/10" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500">差分</span>
              <span
                className={cn(
                  "font-mono text-xs font-bold",
                  data.myBpi - data.rivalBpi > 0
                    ? "text-green-400"
                    : "text-red-400",
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
              <p className="text-sm font-bold text-blue-400">
                総合BPI: {data.myBpi?.toFixed(2)}
              </p>
              <span className="text-[10px] text-gray-500">
                累計: {data.count}曲
              </span>
            </div>
            {data.updateCount > 0 && (
              <>
                <div className="my-2 h-px w-full bg-white/10" />
                <p className="text-[10px] font-bold text-green-400">
                  UPDATED: {data.updateCount} items
                </p>
                <div className="max-h-[120px] w-full overflow-y-auto pr-1">
                  {data.updatedSongs?.map((song: string, idx: number) => (
                    <p key={idx} className="text-[10px] text-white/70">
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
        <h3 className="text-sm font-bold uppercase text-gray-500">
          総合BPI推移
        </h3>
        {rivalData && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-[2px] w-3 bg-blue-500" />
              <span className="text-xs text-blue-400 font-medium">
                {myName}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="h-[2px] w-3 border-t border-dashed border-orange-500 bg-transparent"
                style={{ borderTopWidth: "2px", borderStyle: "dashed" }}
              />
              <span className="text-xs text-orange-400 font-medium">
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
              stroke="#1e293b"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              ticks={ticks}
              tickFormatter={formatDate}
              stroke="#475569"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={["dataMin - 1", "dataMax + 1"]}
              stroke="#475569"
              fontSize={10}
              tickFormatter={(v) => v.toFixed(1)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis yAxisId="right" hide />

            <Tooltip
              content={<HistoryTooltip myName={myName} rivalName={rivalName} />}
              cursor={{ stroke: "#334155" }}
            />

            {!rivalData && (
              <Bar
                yAxisId="right"
                dataKey="updateCount"
                barSize={4}
                shape={<UpdateBar />}
              />
            )}

            <Line
              type="monotone"
              dataKey="myBpi"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                fill: "#0d1117",
                stroke: "#3b82f6",
                strokeWidth: 2,
              }}
              connectNulls
              animationDuration={1000}
            />

            {rivalData && (
              <Line
                type="monotone"
                dataKey="rivalBpi"
                stroke="#f97316"
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
              stroke="#334155"
              fill="#0d1117"
              startIndex={startIndex}
              tickFormatter={() => ""}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </DashCard>
  );
};
