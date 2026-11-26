import type { NextApiRequest, NextApiResponse } from "next";

/**
 * 認証不要の公開 GET API を別オリジンのブラウザアプリから呼べるようにする。
 * プリフライト（OPTIONS）に応答したときは true を返し、呼び出し側は処理を終える。
 */
export function applyPublicGetCors(req: NextApiRequest, res: NextApiResponse): boolean {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "If-None-Match");
  res.setHeader("Access-Control-Expose-Headers", "ETag");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}
