import { useMemo, useState } from "react";
import { useIidxTowerCompare } from "@/hooks/iidxTower/useIidxTower";
import { DashCard } from "@/components/ui/dashcard";
import { IidxTowerCardSkeleton } from "@/components/partials/DashBoard/IidxTowerCard/skeleton";
import { LordiconAnimation } from "@/components/ui/lordicon-animation";
import dayjs from "@/lib/dayjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  ReferenceLine,
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
  defaultPeriod?: number;
}

type Granularity = "day" | "week" | "month";

export const IidxTowerComparisonSection = ({
  rivalUserId,
  myName = "自分",
  rivalName = "ライバル",
  defaultPeriod = 0,
}: Props) => {
  const { data, isLoading } = useIidxTowerCompare(rivalUserId);

  if (isLoading) return <IidxTowerCardSkeleton />;

  return (
    <IidxTowerComparisonCard
      myData={data?.self ?? []}
      rivalData={data?.target ?? []}
      myName={myName}
      rivalName={rivalName}
      defaultPeriod={defaultPeriod}
    />
  );
};

function IidxTowerComparisonCard({
  myData,
  rivalData,
  myName,
  rivalName,
  defaultPeriod,
}: {
  myData: { playDate: string; keyCount: number; scratchCount: number }[];
  rivalData: { playDate: string; keyCount: number; scratchCount: number }[];
  myName: string;
  rivalName: string;
  defaultPeriod: number;
}) {
  const [periodDays, setPeriodDays] = useState<number>(defaultPeriod);
  const [granularity, setGranularity] = useState<Granularity>("week");

  const { myTotals, rivalTotals, chartData, scratchScale } = useMemo(() => {
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

    const maxKey = Math.max(
      ...allDateKeys.map((d) =>
        Math.max(myGroups.get(d)?.key || 0, rivalGroups.get(d)?.key || 0),
      ),
    );
    const maxScr = Math.max(
      ...allDateKeys.map((d) =>
        Math.max(myGroups.get(d)?.scr || 0, rivalGroups.get(d)?.scr || 0),
      ),
    );

    const scratchScale = maxKey > 0 && maxScr > 0 ? maxKey / maxScr : 1;

    const chartData = allDateKeys.map((dateKey) => {
      const myVal = myGroups.get(dateKey);
      const rivalVal = rivalGroups.get(dateKey);

      let label = dayjs(dateKey).format("MM/DD");
      if (granularity === "month") label = dayjs(dateKey).format("YY/MM");
      if (granularity === "week") label = `${dayjs(dateKey).format("MM/DD")}~`;

      const rawMyScr = myVal?.scr || 0;
      const rawRivalScr = rivalVal?.scr || 0;

      return {
        date: label,
        myKey: myVal?.key || 0,
        rivalKey: rivalVal?.key || 0,
        myScr: rawMyScr > 0 ? -(rawMyScr * scratchScale) : 0,
        rivalScr: rawRivalScr > 0 ? -(rawRivalScr * scratchScale) : 0,
        rawMyScr,
        rawRivalScr,
      };
    });

    return { myTotals, rivalTotals, chartData, scratchScale };
  }, [myData, rivalData, periodDays, granularity]);

  const bothEmpty = myData.length === 0 && rivalData.length === 0;

  if (bothEmpty) {
    return (
      <DashCard className="border-2 border-dashed border-bpim-primary/30 bg-bpim-primary/5 p-6 text-center">
        <div className="flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-bpim-primary/10">
            <LordiconAnimation src="/lottie/ghost.json" trigger="loop" size={36} />
          </div>
          <h3 className="tracking-tight text-base font-black text-bpim-text">
            IIDXタワーのデータがありません
          </h3>
        </div>
      </DashCard>
    );
  }

  return (
    <DashCard>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-bpim-muted">
          打鍵比較
        </p>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPeriodDays(p.days)}
              className={`rounded px-2 py-1 text-[10px] font-bold transition-colors ${
                periodDays === p.days
                  ? "bg-bpim-primary text-white"
                  : "bg-bpim-surface-2 text-bpim-muted hover:bg-bpim-surface-3"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex gap-2">
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

      <div className="rounded-xl border border-bpim-border bg-bpim-surface-1/50 p-4">
        <div className="mb-6 flex flex-col gap-3">
          <CompareBar
            label="鍵盤累計"
            myValue={myTotals.key}
            rivalValue={rivalTotals.key}
            myName={myName}
            rivalName={rivalName}
            myColor="var(--color-bpim-primary)"
            rivalColor="var(--color-bpim-success)"
          />
          <CompareBar
            label="スクラッチ累計"
            myValue={myTotals.scratch}
            rivalValue={rivalTotals.scratch}
            myName={myName}
            rivalName={rivalName}
            myColor="var(--color-bpim-warning)"
            rivalColor="var(--color-bpim-danger)"
          />
        </div>

        {chartData.length > 0 && (
          <div className="h-64 -mx-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                barGap={2}
                stackOffset="sign"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-bpim-border)"
                  strokeOpacity={0.4}
                />

                <ReferenceLine
                  y={0}
                  stroke="var(--color-bpim-text)"
                  strokeWidth={1}
                  strokeOpacity={0.3}
                />

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
                  width={34}
                  tickFormatter={(v) => {
                    if (v === 0) return "0";
                    if (v < 0) {
                      const unscaled = Math.abs(v) / scratchScale;
                      if (unscaled >= 1000) {
                        return `${(unscaled / 1000).toFixed(1).replace(/\.0$/, "")}k`;
                      }
                      return Math.round(unscaled).toString();
                    }
                    return v >= 1000
                      ? `${(v / 1000).toFixed(0)}k`
                      : v.toString();
                  }}
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
                    marginBottom: "4px",
                  }}
                  formatter={(v: any, name: any, props: any) => {
                    const nameStr = String(name);
                    if (nameStr.includes("(スクラッチ)")) {
                      const rawVal = name.includes(myName)
                        ? props.payload.rawMyScr
                        : props.payload.rawRivalScr;
                      return [
                        <span key="v" className="tabular-nums font-bold">
                          {fmt(rawVal)}
                        </span>,
                        name,
                      ];
                    }
                    return [
                      <span key="v" className="tabular-nums font-bold">
                        {fmt(Number(v))}
                      </span>,
                      nameStr,
                    ];
                  }}
                  cursor={{ fill: "var(--color-bpim-border)", opacity: 0.1 }}
                />

                <Legend
                  iconSize={8}
                  wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
                />

                <Bar
                  dataKey="myKey"
                  stackId="me"
                  name={`${myName} (鍵盤)`}
                  fill="var(--color-bpim-primary)"
                  radius={[2, 2, 0, 0]}
                  barSize={granularity === "day" ? 8 : 16}
                />
                <Bar
                  dataKey="myScr"
                  stackId="me"
                  name={`${myName} (スクラッチ)`}
                  fill="var(--color-bpim-warning)"
                  radius={[0, 0, 2, 2]}
                />

                <Bar
                  dataKey="rivalKey"
                  stackId="rival"
                  name={`${rivalName} (鍵盤)`}
                  fill="var(--color-bpim-success)"
                  radius={[2, 2, 0, 0]}
                  barSize={granularity === "day" ? 8 : 16}
                />
                <Bar
                  dataKey="rivalScr"
                  stackId="rival"
                  name={`${rivalName} (スクラッチ)`}
                  fill="var(--color-bpim-danger)"
                  radius={[0, 0, 2, 2]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
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
      <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-bpim-muted">
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        <span className="tabular-nums w-16 truncate text-right font-bold text-bpim-text">
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
        <span className="tabular-nums w-16 truncate font-bold text-bpim-text">
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
