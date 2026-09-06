"use client";

import useSWR, { SWRConfiguration, SWRResponse } from "swr";
import { useUser } from "@/contexts/users/UserContext";
import { fetcherV2 } from "@/services/swr/fetchV2";

/**
 * `useAuthedSWR` の API v2 版。共通エンベロープ（`ApiResponse<T>`）を
 * `fetcherV2` で unwrap し、`data` にはエンベロープの `body`（`T`）が入る。
 *
 * キーの組み立て（`fbUser?.uid` のみを使いオブジェクト全体をハッシュ化しない）
 * は `useAuthedSWR` と同じ。v2 へ移行済みのエンドポイントからのみ使う。
 *
 * @param url - フェッチ対象URL（フェッチしない場合は`null`）
 * @param options - SWRの追加オプション
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useAuthedSWRV2<T = any>(
  url: string | null,
  options?: SWRConfiguration,
): SWRResponse<T> {
  const { fbUser } = useUser();
  const key = url ? ([url, fbUser?.uid ?? null] as const) : null;

  return useSWR<T>(
    key,
    () => fetcherV2<T>([url as string, fbUser ?? null]),
    options,
  );
}
