import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";

/**
 * 非公開ユーザー向けフォローリクエスト受付用の招待URLトークンを
 * 取得・発行/再発行するフック。
 */
export const useFollowInvite = () => {
  const { fbUser } = useUser();

  const { data, mutate, isLoading } = useAuthedSWR<{ token: string | null }>(
    fbUser ? `${API_PREFIX}/users/${fbUser.uid}/follow-invite` : null,
  );

  const regenerate = async () => {
    if (!fbUser) return null;
    const res = await authFetch(
      `${API_PREFIX}/users/${fbUser.uid}/follow-invite`,
      "POST",
      fbUser,
    );
    const body = (await res.json()) as { token: string };
    mutate(body, { revalidate: false });
    return body.token;
  };

  return {
    token: data?.token ?? null,
    isLoading,
    regenerate,
  };
};
