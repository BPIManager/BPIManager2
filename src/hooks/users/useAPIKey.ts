import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/apiEndpoints";

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
