import useSWRMutation from "swr/mutation";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { generateApiKey } from "@/services/swr/apiKey";

/**
 * ユーザーの API キー情報の取得と再生成を行うフック。
 *
 * @returns キー情報・生成関数（新しいキーを返す）・ローディング状態
 */
export const useApiKey = () => {
  const { fbUser } = useUser();

  const { data, mutate, isLoading } = useAuthedSWR(
    fbUser ? `${API_PREFIX}/apiKey` : null,
  );

  const { trigger, isMutating } = useSWRMutation(
    `${API_PREFIX}/apiKey`,
    (url) => generateApiKey(url, fbUser),
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
