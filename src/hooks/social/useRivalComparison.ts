import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";

/**
 * ライバルのプロフィールを比較情報付きで取得する。
 *
 * @param rivalId - ライバルのユーザー ID（null の場合はフェッチしない）
 * @returns プロフィールデータ・ローディング状態・エラー・更新関数・再検証中フラグ
 */
export const useRivalComparison = (rivalId: string | null) => {
  const { fbUser } = useUser();

  const { data, error, isLoading, mutate, isValidating } = useAuthedSWRV2(
    fbUser && rivalId
      ? `${API_V2_PREFIX}/users/${rivalId}/profile?compare=true`
      : null,
  );

  return {
    data,
    isLoading,
    error,
    mutate,
    isValidating,
  };
};
