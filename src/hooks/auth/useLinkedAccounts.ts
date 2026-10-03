import useSWR from "swr";
import type { User as FirebaseUser } from "firebase/auth";
import { useUser } from "@/contexts/users/UserContext";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { fetcherV2 } from "@/services/swr/fetchV2";
import type { LinkedAccount } from "@/types/auth/linkedAccounts";

const LINKED_ACCOUNTS_URL = `${API_V2_PREFIX}/auth/linked-accounts`;

const fetchLinkedAccounts = (args: readonly [string, FirebaseUser]) =>
  fetcherV2<{ accounts: LinkedAccount[] }>(args);

/**
 * 連携中のログイン手段一覧を取得する。サーバー側でメールハッシュの同期も行われる。
 */
export function useLinkedAccounts() {
  const { fbUser } = useUser();
  const { data, error, isLoading, mutate } = useSWR(
    fbUser ? [LINKED_ACCOUNTS_URL, fbUser] : null,
    fetchLinkedAccounts,
    { revalidateOnFocus: false },
  );

  return {
    accounts: data?.accounts ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}
