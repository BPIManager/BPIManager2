import { API_PREFIX } from "@/constants/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import { useMemo } from "react";
import useSWR from "swr";

import type { GroupingMode, AAATableItem } from "@/types/metrics/aaa";

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
  goal: "aaa" | "maxMinus",
  mode: GroupingMode,
) => {
  const { fbUser } = useUser();

  const endpoint = userId
    ? `${API_PREFIX}/users/${userId}/stats/aaaDifficulty?level=${level}&version=${version}`
    : `${API_PREFIX}/users/guest/stats/aaaDifficulty?level=${level}&version=${version}`;

  const { data, error, isLoading } = useSWR<AAATableItem[]>(
    version && level ? [endpoint, fbUser] : null,
    fetcher,
  );

  const groupedData = useMemo(() => {
    if (!data) return {};

    const sortedData = [...data].sort((a, b) => {
      const bpiA = a.targets[goal].targetBpi ?? 0;
      const bpiB = b.targets[goal].targetBpi ?? 0;
      return bpiB - bpiA;
    });

    return sortedData.reduce(
      (acc: Record<number, AAATableItem[]>, item) => {
        let bpiValue: number;

        if (mode === "self") {
          bpiValue = item.user.bpi;
        } else {
          bpiValue = item.targets[goal].targetBpi ?? 0;
        }

        const bpiFloor = Math.floor(bpiValue / 10) * 10;
        const key = Math.max(-10, Math.min(90, bpiFloor));

        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<number, AAATableItem[]>,
    );
  }, [data, goal, mode]);

  return { groupedData, isLoading, isError: error };
};
