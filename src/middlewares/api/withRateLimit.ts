import type { NextApiRequest, NextApiResponse } from "next";
import { isIP } from "net";

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
  // CF-Connecting-IP は Cloudflare がエッジで付与する。CF-Ray も Cloudflare 経由でのみ付くため、
  // 両方が揃い IP 形式として妥当な場合のみ信頼する。どちらも無い場合はソケットのアドレスを使う。
  // 注: オリジンに直接接続するクライアントは両ヘッダを偽装できるため、完全な防御には
  // オリジンをCloudflareからのみ到達可能にする設定（Authenticated Origin Pulls等）が別途必要。
  const cfRay = req.headers["cf-ray"];
  const cfConnectingIp = req.headers["cf-connecting-ip"];
  if (typeof cfRay === "string" && typeof cfConnectingIp === "string") {
    const ip = cfConnectingIp.trim();
    if (isIP(ip)) return ip;
  }
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
