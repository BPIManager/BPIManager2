import { useMemo, useState } from "react";
import { useIidxTowerCompare } from "@/hooks/iidxTower/useIidxTower";
import { DashCard } from "@/components/ui/dashcard";
import { IidxTowerCardSkeleton } from "@/components/partials/DashBoard/IidxTowerCard/skeleton";
import { LottieAnimation } from "@/components/ui/lottie-animation";
import ghostAnimation from "@/assets/lottie/ghost.json";
import dayjs from "@/lib/dayjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const PERIODS = [
  { label: "7日", days: 7 },
  { label: "30日", days: 30 },
  { label: "90日", days: 90 },
  { label: "全期間", days: 0 },
] as const;

const GRANULARITIES = [
  { label: "日次", value: "day" },
  { label: "週次", value: "week" },
  { label: "月次", value: "month" },
] as const;

const fmt = (n: number) => n.toLocaleString("ja-JP");

interface Props {
  rivalUserId: string;
  myName?: string;
  rivalName?: string;
}

type Mode = "total" | "key" | "scratch";
type Granularity = "day" | "week" | "month";

export const IidxTowerComparisonSection = ({
  rivalUserId,
  myName = "自分",
  rivalName = "ライバル",
}: Props) => {
  const { data, isLoading } = useIidxTowerCompare(rivalUserId);

  if (isLoading) return <IidxTowerCardSkeleton />;

  return (
    <IidxTowerComparisonCard
      myData={data?.self ?? []}
      rivalData={data?.target ?? []}
      myName={myName}
      rivalName={rivalName}
    />
  );
};

function IidxTowerComparisonCard({
  myData,
  rivalData,
  myName,
  rivalName,
}: {
  myData: { playDate: string; keyCount: number; scratchCount: number }[];
  rivalData: { playDate: string; keyCount: number; scratchCount: number }[];
  myName: string;
  rivalName: string;
}) {
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [mode, setMode] = useState<Mode>("total");
  const [granularity, setGranularity] = useState<Granularity>("day");

  const { myTotals, rivalTotals, chartData } = useMemo(() => {
    const filterAndGroup = (
      arr: { playDate: string; keyCount: number; scratchCount: number }[],
    ) => {
      const filtered =
        periodDays === 0
          ? arr
          : arr.filter((d) =>
              dayjs(d.playDate).isAfter(dayjs().subtract(periodDays, "day")),
            );

      const groups = new Map<string, { key: number; scr: number }>();
      filtered.forEach((d) => {
        const dateKey = dayjs(d.playDate)
          .startOf(granularity)
          .format("YYYY-MM-DD");
        const existing = groups.get(dateKey) || { key: 0, scr: 0 };
        groups.set(dateKey, {
          key: existing.key + d.keyCount,
          scr: existing.scr + d.scratchCount,
        });
      });
      return groups;
    };

    const myGroups = filterAndGroup(myData);
    const rivalGroups = filterAndGroup(rivalData);

    const myTotals = { key: 0, scratch: 0 };
    myGroups.forEach((v) => {
      myTotals.key += v.key;
      myTotals.scratch += v.scr;
    });
    const rivalTotals = { key: 0, scratch: 0 };
    rivalGroups.forEach((v) => {
      rivalTotals.key += v.key;
      rivalTotals.scratch += v.scr;
    });

    const allDateKeys = Array.from(
      new Set([...myGroups.keys(), ...rivalGroups.keys()]),
    ).sort();

    const chartData = allDateKeys.map((dateKey) => {
      const myVal = myGroups.get(dateKey);
      const rivalVal = rivalGroups.get(dateKey);

      const getValue = (v: { key: number; scr: number } | undefined) => {
        if (!v) return 0;
        if (mode === "key") return v.key;
        if (mode === "scratch") return v.scr;
        return v.key + v.scr; // total
      };

      let label = dayjs(dateKey).format("MM/DD");
      if (granularity === "month") label = dayjs(dateKey).format("YY/MM");
      if (granularity === "week") label = `${dayjs(dateKey).format("MM/DD")}~`;

      return {
        date: label,
        [myName]: getValue(myVal),
        [rivalName]: getValue(rivalVal),
      };
    });

    return { myTotals, rivalTotals, chartData };
  }, [myData, rivalData, periodDays, mode, granularity, myName, rivalName]);

  const bothEmpty = myData.length === 0 && rivalData.length === 0;

  if (bothEmpty) {
    return (
      <DashCard className="border-2 border-dashed border-bpim-primary/30 bg-bpim-primary/5 p-6 text-center">
        <div className="flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-bpim-primary/10">
            <LottieAnimation animationData={ghostAnimation} loop size={36} />
          </div>
          <h3 className="text-base font-black text-bpim-text tracking-tight">
            IIDXタワーのデータがありません
          </h3>
        </div>
      </DashCard>
    );
  }

  return (
    <DashCard>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-bold text-bpim-muted uppercase tracking-wide">
          打鍵カウント
        </p>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPeriodDays(p.days)}
              className={`rounded px-2 py-1 text-[10px] font-bold transition-colors ${
                periodDays === p.days
                  ? "bg-bpim-primary text-white"
                  : "bg-bpim-surface-2 text-bpim-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex gap-2">
          {(["total", "key", "scratch"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1 text-[10px] font-bold transition-colors ${
                mode === m
                  ? "bg-bpim-primary text-white"
                  : "bg-bpim-surface-2 text-bpim-muted"
              }`}
            >
              {m === "total" ? "総合" : m === "key" ? "鍵盤" : "スクラッチ"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {GRANULARITIES.map((g) => (
            <button
              key={g.value}
              onClick={() => setGranularity(g.value)}
              className={`rounded-md border px-2 py-0.5 text-[10px] font-medium transition-all ${
                granularity === g.value
                  ? "border-bpim-primary/50 bg-bpim-primary/10 text-bpim-primary"
                  : "border-transparent bg-bpim-surface-3 text-bpim-subtle hover:text-bpim-text"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <CompareBar
          label="鍵盤合計"
          myValue={myTotals.key}
          rivalValue={rivalTotals.key}
          myName={myName}
          rivalName={rivalName}
          myColor="var(--color-bpim-primary)"
          rivalColor="var(--color-bpim-success)"
        />
        <CompareBar
          label="SCR合計"
          myValue={myTotals.scratch}
          rivalValue={rivalTotals.scratch}
          myName={myName}
          rivalName={rivalName}
          myColor="var(--color-bpim-warning)"
          rivalColor="var(--color-bpim-danger)"
        />
      </div>

      {chartData.length > 0 && (
        <div className="h-44 -mx-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "var(--color-bpim-subtle)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "var(--color-bpim-subtle)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                }
                width={28}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-bpim-surface-2)",
                  border: "1px solid var(--color-bpim-border)",
                  borderRadius: "8px",
                  fontSize: "11px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                }}
                labelStyle={{
                  color: "var(--color-bpim-text)",
                  fontWeight: "bold",
                }}
                formatter={(v: any, name: any) => [
                  <span key="v" className="font-bold">
                    {fmt(Number(v))}
                  </span>,
                  name,
                ]}
                cursor={{ fill: "var(--color-bpim-border)", opacity: 0.1 }}
              />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
              />
              <Bar
                dataKey={myName}
                fill="var(--color-bpim-primary)"
                radius={[2, 2, 0, 0]}
                barSize={granularity === "day" ? 8 : 16}
              />
              <Bar
                dataKey={rivalName}
                fill="var(--color-bpim-success)"
                radius={[2, 2, 0, 0]}
                barSize={granularity === "day" ? 8 : 16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashCard>
  );
}

function CompareBar({
  label,
  myValue,
  rivalValue,
  myName,
  rivalName,
  myColor,
  rivalColor,
}: {
  label: string;
  myValue: number;
  rivalValue: number;
  myName: string;
  rivalName: string;
  myColor: string;
  rivalColor: string;
}) {
  const total = myValue + rivalValue || 1;
  const myPct = Math.round((myValue / total) * 100);
  const rivalPct = 100 - myPct;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] text-bpim-muted font-bold">
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        <span className="w-16 truncate text-right font-bold tabular-nums text-bpim-text">
          {fmt(myValue)}
        </span>
        <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-bpim-surface-3">
          <div
            className="transition-all duration-500"
            style={{ width: `${myPct}%`, backgroundColor: myColor }}
          />
          <div
            className="transition-all duration-500"
            style={{ width: `${rivalPct}%`, backgroundColor: rivalColor }}
          />
        </div>
        <span className="w-16 truncate font-bold tabular-nums text-bpim-text">
          {fmt(rivalValue)}
        </span>
      </div>
      <div className="mt-0.5 flex items-center justify-between text-[9px]">
        <span style={{ color: myColor }}>
          {myName} ({myPct}%)
        </span>
        <span style={{ color: rivalColor }}>
          ({rivalPct}%) {rivalName}
        </span>
      </div>
    </div>
  );
}
