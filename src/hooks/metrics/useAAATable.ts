import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import { useMemo } from "react";
import useSWR from "swr";

import type { GroupingMode, GoalType, AAATableItem } from "@/types/metrics/aaa";

/**
 * 指定レベルの AAA / Max- 達成テーブルデータを取得し、BPI 帯でグループ化して返す。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param version - IIDX バージョン文字列
 * @param level - 難易度レベル（例: `12`）
 * @param goal - 達成目標（`"aaa"` または `"maxMinus"`）
 * @param mode - グループ化基準（{@link GroupingMode}）
 * @returns BPI 帯をキーとしたグループデータ・ローディング状態・エラー情報
 */
export const useAAATable = (
  userId: string | undefined,
  version: string,
  level: number,
  goal: GoalType,
  mode: GroupingMode,
  customGoalRatio?: number,
  customGoalOffset?: number,
) => {
  const { fbUser } = useUser();

  const params = new URLSearchParams({ level: String(level), version });
  if (goal === "custom" && customGoalRatio !== undefined) {
    params.set("customGoalRatio", String(customGoalRatio));
    if (customGoalOffset) params.set("customGoalOffset", String(customGoalOffset));
  }
  const base = userId
    ? `${API_PREFIX}/users/${userId}/stats/aaaDifficulty`
    : `${API_PREFIX}/users/guest/stats/aaaDifficulty`;
  const endpoint = `${base}?${params}`;

  const isReady =
    !!(version && level) &&
    (goal !== "custom" || customGoalRatio !== undefined);

  const { data, error, isLoading } = useSWR<AAATableItem[]>(
    isReady ? [endpoint, fbUser] : null,
    fetcher,
  );

  const getTargetBpi = (item: AAATableItem) =>
    goal === "custom"
      ? (item.targets.custom?.targetBpi ?? 0)
      : item.targets[goal].targetBpi ?? 0;

  const groupedData = useMemo(() => {
    if (!data) return {};

    const sortedData = [...data].sort((a, b) => getTargetBpi(b) - getTargetBpi(a));

    return sortedData.reduce(
      (acc: Record<number, AAATableItem[]>, item) => {
        const bpiValue = mode === "self" ? item.user.bpi : getTargetBpi(item);
        const bpiFloor = Math.floor(bpiValue / 10) * 10;
        const key = Math.max(-10, Math.min(90, bpiFloor));

        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<number, AAATableItem[]>,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, goal, mode, customGoalRatio, customGoalOffset]);

  return { groupedData, isLoading, isError: error };
};
