import type { FilterParamsFrontend } from "@/types/songs/score";

/**
 * 詳細フィルターで適用中の条件の数を数える（フィルターバーのボタンのバッジ用）。
 * BPM範囲・ソフラン、クリア状況、日付、バージョン、レーダー、ミス数はそれぞれ1件、スコア条件は値が入っている条件ごとに1件。
 */
export function countAdvancedFilters(
  params: FilterParamsFrontend,
  options: { playState?: boolean } = {},
): number {
  const groups = [
    params.bpmMin !== undefined ||
      params.bpmMax !== undefined ||
      !!params.isSofran ||
      !!params.excludeSofran,
    (params.clearStates?.length ?? 0) > 0,
    !!params.since || !!params.until,
    (params.versions?.length ?? 0) > 0,
    (params.radarCategories?.length ?? 0) > 0,
    params.missCountMin !== undefined || params.missCountMax !== undefined,
    // プレイ状態の既定はプレイ済みのみ（未指定=true）。それ以外を選んでいるときに数える
    !!options.playState && params.isMyPlayed !== undefined && params.isMyPlayed !== true,
  ];
  const scoreConditions =
    params.scoreFilters?.filter((f) => f.value !== "").length ?? 0;
  return groups.filter(Boolean).length + scoreConditions;
}
