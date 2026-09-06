import type { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess, rejectAccess, type AccessResult } from "./withApi";

type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
) => unknown | Promise<unknown>;

function defaultOnError(error: unknown, res: NextApiResponse) {
  const errorMessage =
    error instanceof Error ? error.message : "Internal Server Error";
  return res.status(500).json({ message: errorMessage });
}

/**
 * `checkUserAccess` によるアクセス権チェック・クエリのパース・try-catchによる
 * エラーハンドリングをまとめる共通ラッパー。
 *
 * `parseQuery` はクエリのバリデーションに加え、メソッドチェック等
 * アクセス権チェックより前に行うべき検証を含めてよい（失敗時は自身で
 * レスポンスを返し `null` を返すこと）。アクセス権チェック後のメソッド
 * ルーティングやビジネスロジックは `handler` 側で行う。
 */
export function withUserApiHandler<T extends { userId: string }>(
  parseQuery: (req: NextApiRequest, res: NextApiResponse) => T | null,
  handler: (
    req: NextApiRequest,
    res: NextApiResponse,
    query: T,
    access: AccessResult,
  ) => unknown | Promise<unknown>,
  options?: {
    onError?: (error: unknown, res: NextApiResponse) => unknown;
    onReject?: (res: NextApiResponse, access: AccessResult) => unknown;
  },
): ApiHandler {
  const onError = options?.onError ?? defaultOnError;
  const onReject = options?.onReject ?? rejectAccess;

  return async function (req: NextApiRequest, res: NextApiResponse) {
    const query = parseQuery(req, res);
    if (!query) return;

    try {
      const access = await checkUserAccess(req, query.userId);
      if (!access.hasAccess) return onReject(res, access);

      return await handler(req, res, query, access);
    } catch (error: unknown) {
      return onError(error, res);
    }
  };
}
