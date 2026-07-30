import type { NextApiRequest, NextApiResponse } from "next";

interface RateLimitOptions {
  /** 制限をカウントする時間窓（ミリ秒） */
  windowMs: number;
  /** 時間窓内に許可するリクエスト数 */
  max: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/** メモリ肥大化を防ぐための安全弁。これを超えたら古いエントリごと破棄する。 */
const MAX_TRACKED_CLIENTS = 5000;

const buckets = new Map<string, Bucket>();

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress ?? "unknown";
}

/**
 * IPアドレス単位の簡易レート制限を行うAPIミドルウェア。
 *
 * インスタンス内メモリでカウントするため、複数インスタンス構成では
 * インスタンスごとに別カウントになる（多層防御としての簡易実装）。
 *
 * @param handler - ラップ対象のAPIハンドラー
 * @param options.windowMs - 制限をカウントする時間窓（ミリ秒）
 * @param options.max - 時間窓内に許可するリクエスト数
 */
export const withRateLimit = (
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options: RateLimitOptions,
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const ip = getClientIp(req);
    const now = Date.now();

    if (buckets.size > MAX_TRACKED_CLIENTS) {
      buckets.clear();
    }

    const bucket = buckets.get(ip);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(ip, { count: 1, resetAt: now + options.windowMs });
    } else {
      bucket.count += 1;
      if (bucket.count > options.max) {
        const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
        res.setHeader("Retry-After", String(retryAfterSec));
        return res.status(429).json({ message: "Too Many Requests" });
      }
    }

    return handler(req, res);
  };
};
