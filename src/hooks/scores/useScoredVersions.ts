import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";

/**
 * 指定ユーザーがスコアを登録しているバージョン一覧を取得する。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @returns バージョン番号の配列・ローディング状態
 */
export const useScoredVersions = (userId: string | undefined) => {
  const { data, isLoading } = useAuthedSWRV2<string[]>(
    userId ? `${API_V2_PREFIX}/users/${userId}/scores/versions` : null,
    { revalidateOnFocus: false },
  );
  return { versions: data, isLoading };
};
