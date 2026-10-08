import { useMemo } from "react";
import type { AnalyticsTarget } from "@/types/analytics";
import type { SongWithRival } from "@/types/songs/score";
import { MAX_ANALYTICS_TARGETS } from "@/constants/logic/analyticsComparison";
import { useAnalyticsComparison } from "./useAnalyticsComparison";
import { mergeTargetSongs } from "./mergeTargets";

/**
 * 複数の比較ターゲットを並列に取得し、1譜面1行にまとめて返す。
 * フックの呼び出し回数を固定にするため、`MAX_ANALYTICS_TARGETS`(5)件分を常に呼び、
 * 未使用の枠は`null`を渡して何もフェッチしない。
 *
 * @param targets - 比較ターゲット（最大`MAX_ANALYTICS_TARGETS`件。超過分は無視）
 * @param version - 自スコアのIIDXバージョン
 */
export const useMultiAnalyticsComparison = (
  targets: AnalyticsTarget[],
  version?: string,
): {
  songs: SongWithRival[] | undefined;
  isLoading: boolean;
  error: Error | undefined;
  labels: string[];
  refresh: () => void;
} => {
  const r0 = useAnalyticsComparison(targets[0] ?? null, version);
  const r1 = useAnalyticsComparison(targets[1] ?? null, version);
  const r2 = useAnalyticsComparison(targets[2] ?? null, version);
  const r3 = useAnalyticsComparison(targets[3] ?? null, version);
  const r4 = useAnalyticsComparison(targets[4] ?? null, version);

  const active = [r0, r1, r2, r3, r4].slice(
    0,
    Math.min(targets.length, MAX_ANALYTICS_TARGETS),
  );

  const isLoading = active.some((r) => r.isLoading);
  const error = active.find((r) => r.error)?.error;

  // 単一ターゲットは従来どおりの結果をそのまま返し、マージ処理を挟まない
  const songs = useMemo(() => {
    if (isLoading) return undefined;
    if (active.length === 1) return active[0].songs;
    if (active.every((r) => !r.songs)) return undefined;
    return mergeTargetSongs(active.map((r) => r.songs));
    // active の各 songs 参照が変わったときだけ再計算する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, active.length, r0.songs, r1.songs, r2.songs, r3.songs, r4.songs]);

  const refresh = () => active.forEach((r) => r.refresh());

  return {
    songs,
    isLoading,
    error,
    labels: active.map((r) => r.rivalLabel),
    refresh,
  };
};
