"use client";

import useSWR, { SWRConfiguration, SWRResponse } from "swr";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";

/**
 * Firebase Authでの認証付きフェッチを行う共通SWRフック。
 *
 * SWRのキャッシュキーにFirebase `User`オブジェクト全体を含めると、
 * レンダリングの都度その大きくネストしたオブジェクトがハッシュ化され
 * 無駄な処理コストがかかる。ここでは `fbUser?.uid`（文字列）のみを
 * キーに使い、`fbUser`自体はクロージャ経由でfetcherに渡すことで
 * 認証トークン取得の挙動は変えずにキーを軽量化する。
 *
 * @param url - フェッチ対象URL（フェッチしない場合は`null`）
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
