import useSWRMutation from "swr/mutation";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { useUser } from "@/contexts/users/UserContext";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { generateApiKey } from "@/services/swr/apiKey";

/**
 * ユーザーの API キー情報の取得と再生成を行うフック。
 *
 * @returns キー情報・生成関数（新しいキーを返す）・ローディング状態
 */
export const useApiKey = () => {
  const { fbUser } = useUser();

  const { data, mutate, isLoading } = useAuthedSWRV2(
    fbUser ? `${API_V2_PREFIX}/apiKey` : null,
  );

  const { trigger, isMutating } = useSWRMutation(
    `${API_V2_PREFIX}/apiKey`,
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
