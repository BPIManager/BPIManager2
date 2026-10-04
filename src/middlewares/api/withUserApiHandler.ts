import type { NextApiRequest, NextApiResponse } from "next";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { checkUserAccess, rejectAccess, type AccessResult } from "./withApi";

type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
) => unknown | Promise<unknown>;

function defaultOnError(error: unknown, res: NextApiResponse) {
  return res.status(500).json({ message: toErrorMessage(error) });
}

/**
 * checkUserAccess によるアクセス権チェック・クエリパース・エラーハンドリングをまとめる共通ラッパー。
 * parseQuery はアクセス権チェックより前に行う検証も含めてよい（失敗時は自身でレスポンスを返し null を返す）。
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
