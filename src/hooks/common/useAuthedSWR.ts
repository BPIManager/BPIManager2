"use client";

import useSWR, { SWRConfiguration, SWRResponse } from "swr";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";

/**
 * Firebase認証付きフェッチの共通SWRフック。キーには fbUser.uid のみを使い、巨大な User オブジェクトのハッシュ化を避ける。
 *
 * @param url - フェッチ対象URL（フェッチしない場合は null）
 * @param options - SWRの追加オプション
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useAuthedSWR<T = any>(
  url: string | null,
  options?: SWRConfiguration,
): SWRResponse<T> {
  const { fbUser } = useUser();
  const key = url ? ([url, fbUser?.uid ?? null] as const) : null;

  return useSWR<T>(
    key,
    () => fetcher([url as string, fbUser ?? null]),
    options,
  );
}
