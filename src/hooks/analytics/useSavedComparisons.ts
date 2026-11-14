import { mutate as globalMutate } from "swr";
import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import {
  createSavedComparison,
  deleteSavedComparison,
  renameSavedComparison,
  rankingTabsUrl,
  savedComparisonsUrl,
} from "@/services/swr/savedComparisons";
import type { AnalyticsTarget } from "@/types/analytics";
import type { SavedComparison } from "@/types/analytics/saved";

/**
 * 保存済み比較（条件のみ）の取得・作成・改名・削除。結果は保存されず、呼び出すたびに最新データで計算される。
 *
 * @param enabled - false の間は取得しない（未ログイン時など）
 */
export const useSavedComparisons = (enabled = true) => {
  const { fbUser } = useUser();
  const userId = fbUser?.uid;
  const url = enabled && userId ? savedComparisonsUrl(userId) : null;

  const { data, error, isLoading, mutate } = useAuthedSWRV2<{
    comparisons: SavedComparison[];
  }>(url, { revalidateOnFocus: false });

  const create = async (name: string, targets: AnalyticsTarget[]) => {
    if (!fbUser) return;
    const { id } = await createSavedComparison(fbUser, name, targets);
    await mutate();
    return id;
  };

  const rename = async (id: number, name: string) => {
    if (!fbUser) return;
    await renameSavedComparison(fbUser, id, name);
    await mutate();
  };

  const remove = async (id: number) => {
    if (!fbUser) return;
    await deleteSavedComparison(fbUser, id);
    // 削除した比較はダッシュボードのタブ設定からも消えるため、タブ設定の取得結果も再検証する
    await Promise.all([
      mutate(),
      globalMutate(
        (key) => Array.isArray(key) && key[0] === rankingTabsUrl(fbUser.uid),
      ),
    ]);
  };

  return {
    comparisons: data?.comparisons ?? [],
    isLoading,
    isError: error,
    create,
    rename,
    remove,
    mutate,
  };
};
