import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";
import { unwrapApiResponse } from "@/services/swr/fetchV2";

/**
 * 非公開ユーザー向けフォローリクエスト受付用の招待URLトークンを
 * 取得・発行/再発行するフック。
 */
export const useFollowInvite = () => {
  const { fbUser } = useUser();

  const { data, mutate, isLoading } = useAuthedSWRV2<{ token: string | null }>(
    fbUser ? `${API_V2_PREFIX}/users/${fbUser.uid}/follow-invite` : null,
  );

  const regenerate = async () => {
    if (!fbUser) return null;
    const res = await authFetch(
      `${API_V2_PREFIX}/users/${fbUser.uid}/follow-invite`,
      "POST",
      fbUser,
    );
    if (!res.ok) {
      throw new Error("Failed to regenerate invite link");
    }
    const token = await unwrapApiResponse<{ token: string }>(res);
    mutate(token, { revalidate: false });
    return token.token;
  };

  return {
    token: data?.token ?? null,
    isLoading,
    regenerate,
  };
};
