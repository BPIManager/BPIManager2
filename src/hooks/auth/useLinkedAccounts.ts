import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import type { LinkedAccount } from "@/types/auth/linkedAccounts";

const LINKED_ACCOUNTS_URL = `${API_V2_PREFIX}/auth/linked-accounts`;

/**
 * 連携中のログイン手段一覧を取得する。サーバー側でメールハッシュの同期も行われる。
 */
export function useLinkedAccounts() {
  // キーに含める認証情報は uid（useAuthedSWRV2）に統一する。Userオブジェクト全体だとトークン更新のたびに別キーになる
  const { data, error, isLoading, mutate } = useAuthedSWRV2<{
    accounts: LinkedAccount[];
  }>(LINKED_ACCOUNTS_URL, { revalidateOnFocus: false });

  return {
    accounts: data?.accounts ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}
