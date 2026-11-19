import type { NextApiRequest, NextApiResponse } from "next";
import { isIP } from "net";
import { writeMiddlewareError } from "./apiResult";

interface RateLimitOptions {
  /** 制限をカウントする時間窓（ミリ秒） */
  windowMs: number;
  /** 時間窓内に許可するリクエスト数 */
  max: number;
  /** カウンタの識別名。未指定はリクエストのパス（クエリ除く）で、ルートごとに独立したカウンタになる */
  name?: string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/** メモリ肥大化を防ぐための安全弁。これを超えたら古いエントリごと破棄する。 */
const MAX_TRACKED_CLIENTS = 5000;

const buckets = new Map<string, Bucket>();

/** 期限切れを先に掃除し、それでも多ければ古い順に半分まで捨てる（全消去すると制限をリセットできてしまうため） */
function evictBuckets(now: number) {
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size <= MAX_TRACKED_CLIENTS) return;
  const excess = buckets.size - Math.floor(MAX_TRACKED_CLIENTS / 2);
  let removed = 0;
  for (const key of buckets.keys()) {
    if (removed++ >= excess) break;
    buckets.delete(key);
  }
}

function getClientIp(req: NextApiRequest): string {
  // CF-Connecting-IP と CF-Ray は両方揃い IP 形式として妥当な場合のみ信頼し、無ければソケットのアドレスを使う。
  // 注: オリジンに直接接続するクライアントはヘッダを偽装できるため、完全な防御には Authenticated Origin Pulls 等が別途必要。
  const cfRay = req.headers["cf-ray"];
  const cfConnectingIp = req.headers["cf-connecting-ip"];
  if (typeof cfRay === "string" && typeof cfConnectingIp === "string") {
    const ip = cfConnectingIp.trim();
    if (isIP(ip)) return ip;
  }
  return req.socket.remoteAddress ?? "unknown";
}

/**
 * IP 単位の簡易レート制限。インスタンス内メモリでカウントするため、複数インスタンスでは別々にカウントされる（多層防御の簡易実装）。
 *
 * @param handler - ラップ対象の API ハンドラー
 * @param options.windowMs - 制限をカウントする時間窓（ミリ秒）
 * @param options.max - 時間窓内に許可するリクエスト数
 */
export const withRateLimit = (
  handler: (req: NextApiRequest, res: NextApiResponse) => unknown,
  options: RateLimitOptions,
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const routeKey = options.name ?? (req.url ?? "").split("?")[0];
    const ip = `${routeKey}:${getClientIp(req)}`;
    const now = Date.now();

    if (buckets.size > MAX_TRACKED_CLIENTS) {
      evictBuckets(now);
    }

    const bucket = buckets.get(ip);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(ip, { count: 1, resetAt: now + options.windowMs });
    } else {
      bucket.count += 1;
      if (bucket.count > options.max) {
        const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
        res.setHeader("Retry-After", String(retryAfterSec));
        return writeMiddlewareError(req, res, 429, "Too Many Requests");
      }
    }

    return handler(req, res);
  };
};
