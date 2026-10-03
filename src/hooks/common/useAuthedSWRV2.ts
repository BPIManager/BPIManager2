"use client";

import useSWR, { SWRConfiguration, SWRResponse } from "swr";
import { useUser } from "@/contexts/users/UserContext";
import { fetcherV2 } from "@/services/swr/fetchV2";

/**
 * useAuthedSWR の API v2 版。共通エンベロープを fetcherV2 で unwrap し、data には body（T）が入る。
 * v2 へ移行済みのエンドポイントからのみ使う。キーの組み立ては useAuthedSWR と同じ。
 *
 * @param url - フェッチ対象URL（フェッチしない場合は null）
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
