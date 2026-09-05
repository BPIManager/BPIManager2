import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DashCard } from "@/components/ui/dashcard";
import DistributionChart from "@/components/partials/common/DashBoard/DistributionChart/ui";
import { getBpiColor } from "@/constants/theme/bpiColor";
import { useChartColors } from "@/hooks/common/useChartColors";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { ChartData } from "@/types/ui/chart";
import type { NewBpiRow } from "./ui";

/** BPI帯の分布集計に使うバケット幅。既存のBPI分布グラフ(step=10)に合わせる。 */
const BPI_BUCKET_STEP = 10;

const bucketByBpi = (values: number[]): ChartData[] => {
  const buckets: ChartData[] = [{ label: "<-10", count: 0 }];
  for (let v = -10; v < 100; v += BPI_BUCKET_STEP) {
    buckets.push({ label: v.toString(), count: 0 });
  }
  buckets.push({ label: "100+", count: 0 });

  for (const bpi of values) {
    let idx: number;
    if (bpi < -10) idx = 0;
    else if (bpi >= 100) idx = buckets.length - 1;
    else idx = Math.floor((bpi - -10) / BPI_BUCKET_STEP) + 1;
    if (buckets[idx]) buckets[idx].count++;
  }
  return buckets;
};

/** 差分(新−現行)のヒストグラム用バケット幅 */
const DELTA_BUCKET_STEP = 5;

const bucketByDelta = (deltas: number[]): { label: string; count: number }[] => {
  if (deltas.length === 0) return [];
  const min = Math.min(...deltas);
  const max = Math.max(...deltas);
  const lo = Math.floor(min / DELTA_BUCKET_STEP) * DELTA_BUCKET_STEP;
  const hi = Math.ceil(max / DELTA_BUCKET_STEP) * DELTA_BUCKET_STEP;

  const buckets: { from: number; to: number; count: number }[] = [];
  for (let v = lo; v < hi; v += DELTA_BUCKET_STEP) {
    buckets.push({ from: v, to: v + DELTA_BUCKET_STEP, count: 0 });
  }
  if (buckets.length === 0) {
    buckets.push({ from: lo, to: lo + DELTA_BUCKET_STEP, count: 0 });
  }

  for (const d of deltas) {
    const idx = Math.min(
      buckets.length - 1,
      Math.floor((d - lo) / DELTA_BUCKET_STEP),
    );
    if (buckets[idx]) buckets[idx].count++;
  }

  return buckets.map((b) => ({
    label: `${b.from > 0 ? "+" : ""}${b.from}〜${b.to > 0 ? "+" : ""}${b.to}`,
    count: b.count,
  }));
};

interface Props {
  rows: NewBpiRow[];
}

/**
 * 「一覧」タブに表示中の楽曲(フィルタ適用後)を対象にした集計。
 * 新方式への変更が自分のスコアにどう効くかを俯瞰できるようにする。
 */
export default function ListSummary({ rows }: Props) {
  const { t } = useTranslation();
  const colors = useChartColors();

  const { increaseCount, decreaseCount, unchangedCount, noParamCount, deltaBuckets, bpiCurrent, bpiNew } =
    useMemo(() => {
      let increaseCount = 0;
      let decreaseCount = 0;
      let unchangedCount = 0;
      let noParamCount = 0;
      const deltas: number[] = [];
      const currentBpis: number[] = [];
      const newBpis: number[] = [];

      for (const row of rows) {
        if (row.currentBpi !== null) currentBpis.push(row.currentBpi);
        if (row.newBpi !== null) newBpis.push(row.newBpi);
        if (row.delta === null) {
          noParamCount++;
          continue;
        }
        deltas.push(row.delta);
        if (row.delta > 0.005) increaseCount++;
        else if (row.delta < -0.005) decreaseCount++;
        else unchangedCount++;
      }

      return {
        increaseCount,
        decreaseCount,
        unchangedCount,
        noParamCount,
        deltaBuckets: bucketByDelta(deltas),
        bpiCurrent: bucketByBpi(currentBpis),
        bpiNew: bucketByBpi(newBpis),
      };
    }, [rows]);

  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DashCard>
          <div className="text-xs text-muted-foreground">
            {t("newBpi.listSummary.increase")}
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {increaseCount}
          </div>
        </DashCard>
        <DashCard>
          <div className="text-xs text-muted-foreground">
            {t("newBpi.listSummary.decrease")}
          </div>
          <div className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {decreaseCount}
          </div>
        </DashCard>
        <DashCard>
          <div className="text-xs text-muted-foreground">
            {t("newBpi.listSummary.unchanged")}
          </div>
          <div className="mt-1 text-2xl font-bold">{unchangedCount}</div>
        </DashCard>
        <DashCard>
          <div className="text-xs text-muted-foreground">
            {t("newBpi.listSummary.noParam")}
          </div>
          <div className="mt-1 text-2xl font-bold text-muted-foreground">
            {noParamCount}
          </div>
        </DashCard>
      </div>

      <DashCard>
        <h3 className="mb-4 text-sm font-bold uppercase text-bpim-muted">
          {t("newBpi.listSummary.deltaHistogram")}
        </h3>
        {deltaBuckets.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deltaBuckets} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#64748b" }}
                interval={0}
                angle={-40}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bpim-bg)",
                  border: "1px solid var(--bpim-border)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {deltaBuckets.map((b, i) => (
                  <Cell
                    key={i}
                    fill={b.label.startsWith("+") || b.label.startsWith("0") ? colors.primary : colors.warning}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            {t("newBpi.empty")}
          </p>
        )}
      </DashCard>

      <DistributionChart
        title={t("newBpi.listSummary.bandDistribution")}
        myData={bpiCurrent}
        isLoading={false}
        getColor={getBpiColor}
        myName={t("newBpi.table.currentBpi")}
        rivalComparison={{ rivalData: bpiNew, rivalName: t("newBpi.table.newBpi") }}
      />
    </div>
  );
}
