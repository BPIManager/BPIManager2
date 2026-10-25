import type { PerformanceDay } from "@/types/logs/performance";

export type PerformanceMetric =
  | "songCount"
  | "playMinutes"
  | "sessionBpi"
  | "keyCount"
  | "scratchCount";

export interface MetricComparison {
  /** 比較対象日の値。未取得(null)なら null */
  value: number | null;
  /** 過去プレイ日の平均。値を持つ日が無ければ null */
  average: number | null;
  /** value - average */
  diff: number | null;
  /** 平均に対する増減率(%)。平均が0なら null */
  percent: number | null;
}

const mean = (xs: number[]) =>
  xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

/** 直近 `days` プレイ日(新しい順の `past` の先頭から)の平均と対象日を比較する。値が null の日は平均から除く */
export const compareMetric = (
  target: PerformanceDay | null,
  past: PerformanceDay[],
  metric: PerformanceMetric,
  days: number,
): MetricComparison => {
  const value = target?.[metric] ?? null;
  const average = mean(
    past
      .slice(0, days)
      .map((d) => d[metric])
      .filter((v): v is number => v !== null),
  );
  if (value === null || average === null) {
    return { value, average, diff: null, percent: null };
  }
  const diff = value - average;
  return {
    value,
    average,
    diff,
    percent: average === 0 ? null : (diff / average) * 100,
  };
};

/** 単曲BPIの単純移動平均(窓幅 `window`、先頭は取得できた範囲で平均)。null は直前の値を引き継がず平均から除く */
export const movingAverage = (
  values: (number | null)[],
  window: number,
): (number | null)[] =>
  values.map((_, i) => {
    const slice = values
      .slice(Math.max(0, i - window + 1), i + 1)
      .filter((v): v is number => v !== null);
    return mean(slice);
  });
