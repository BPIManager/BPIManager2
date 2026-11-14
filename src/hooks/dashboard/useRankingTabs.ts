import { useMemo } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { useSavedComparisons } from "@/hooks/analytics/useSavedComparisons";
import { rankingTabsUrl, saveRankingTabs } from "@/services/swr/savedComparisons";
import {
  mergeRankingTabs,
  toTabSettings,
  type RankingTabEntry,
} from "@/lib/dashboard/rankingTabs";
import type { RankingTabSetting } from "@/types/analytics/saved";

/**
 * ダッシュボードのランキングタブ（組み込み3タブ + 保存済み比較）の並び・表示設定を取得・保存する。
 * 設定・保存済み比較の両方が揃うまで `isLoading` を true にし、既定の並びを一瞬見せてちらつくのを防ぐ。
 */
export const useRankingTabs = () => {
  const { fbUser } = useUser();
  const userId = fbUser?.uid;
  const {
    comparisons,
    isLoading: comparisonsLoading,
    mutate: mutateComparisons,
  } = useSavedComparisons();

  const { data, isLoading: tabsLoading, mutate } = useAuthedSWRV2<{
    tabs: RankingTabSetting[];
  }>(userId ? rankingTabsUrl(userId) : null, { revalidateOnFocus: false });

  const entries = useMemo(
    () => mergeRankingTabs(data?.tabs ?? [], comparisons),
    [data, comparisons],
  );

  const save = async (next: RankingTabEntry[]) => {
    if (!fbUser) return;
    await saveRankingTabs(fbUser, toTabSettings(next));
    await mutate();
  };

  return {
    entries,
    comparisons,
    isLoading: tabsLoading || comparisonsLoading,
    save,
    mutateComparisons,
  };
};
