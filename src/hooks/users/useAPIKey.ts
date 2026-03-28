import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/apiEndpoints";

/**
 * ユーザーの API キー情報の取得と再生成を行うフック。
 *
 * @returns キー情報・生成関数（新しいキーを返す）・ローディング状態
 */
export const useApiKey = () => {
  const { fbUser } = useUser();

  const { data, mutate, isLoading } = useSWR(
    fbUser ? [`${API_PREFIX}/apiKey`, fbUser] : null,
    fetcher,
  );

  const { trigger, isMutating } = useSWRMutation(
    `${API_PREFIX}/apiKey`,
    async (url) => {
      const token = await fbUser?.getIdToken();
      const res = await fetch(url, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  );

  return {
    keyInfo: data,
    generate: async () => {
      const result = await trigger();
      await mutate();
      return result.key;
    },
    isLoading: isLoading || isMutating,
  };
};
