import type { ApiResponse } from "@/types/api";

/**
 * API v2 共通エンベロープ（`ApiResponse<T>`）を解釈する SWR フェッチャー。
 * v1 用の `fetcher`（`@/utils/common/fetch`）とは別物で、v2 へ移行済みの
 * エンドポイントを叩くフックからのみ使う。
 *
 * - HTTP エラー、レスポンスがエンベロープ形式でない、または `error: true` の
 *   とき、`info` / `status` 付きの Error を throw する（v1 `fetcher` と同じ形）
 * - 正常時は unwrap した `body`（`T`）を返す
 */

type FetcherUser = { getIdToken: () => Promise<string> } | null;

interface FetchError extends Error {
  info?: unknown;
  status?: number;
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "boolean" &&
    "body" in value
  );
}

/**
 * `fetch` の `Response` を `ApiResponse<T>` として解釈し、`body` を取り出す。
 * v2 のミューテーション呼び出し側からも利用できるよう分離してある。
 */
export async function unwrapApiResponse<T>(res: Response): Promise<T> {
  const json = (await res.json().catch(() => null)) as unknown;

  if (!res.ok || !isApiResponse(json) || json.error) {
    const message =
      isApiResponse(json) && json.errorMessage
        ? json.errorMessage
        : "An error occurred while fetching the data.";
    const error: FetchError = new Error(message);
    error.info = json ?? {};
    error.status = res.status;
    throw error;
  }

  return json.body as T;
}

export const fetcherV2 = async <T = unknown>(
  args: string | readonly [string, FetcherUser],
): Promise<T> => {
  const url = typeof args === "string" ? args : args[0];
  const user = typeof args === "string" ? null : args[1];

  const headers: HeadersInit = {};

  if (user && typeof user.getIdToken === "function") {
    headers["Authorization"] = `Bearer ${await user.getIdToken()}`;
  }

  const res = await fetch(url, { headers });

  return unwrapApiResponse<T>(res);
};
