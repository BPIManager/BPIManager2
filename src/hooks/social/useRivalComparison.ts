import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";

/**
 * ライバルのプロフィールを比較情報付きで取得する。
 *
 * @param rivalId - ライバルのユーザー ID（null の場合はフェッチしない）
 * @returns プロフィールデータ・ローディング状態・エラー・更新関数・再検証中フラグ
 */
export const useRivalComparison = (rivalId: string | null) => {
  const { fbUser } = useUser();

  const { data, error, isLoading, mutate, isValidating } = useAuthedSWR(
    fbUser && rivalId
      ? `${API_PREFIX}/users/${rivalId}/profile?compare=true`
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
