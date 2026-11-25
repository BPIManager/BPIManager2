import { createHmac } from "crypto";

/**
 * IIDX ID の HMAC-SHA256（hex）を返す。鍵は環境変数 IIDX_ID_HASH_PEPPER。
 * 8桁は総当たり可能なので、鍵が漏れない限りハッシュから復元できない前提。
 *
 * @param iidxId - 8桁の IIDX ID（ハイフン有無どちらも可）
 */
export function hashIidxId(iidxId: string): string {
  const pepper = process.env.IIDX_ID_HASH_PEPPER;
  if (!pepper) throw new Error("IIDX_ID_HASH_PEPPER is not set");
  return createHmac("sha256", pepper)
    .update(iidxId.replace(/-/g, ""))
    .digest("hex");
}

/**
 * IIDX ID がブロック対象か判定する。ブロックリストは環境変数
 * BLOCKED_IIDX_ID_HASHES（カンマ区切りの hex ハッシュ）。
 * 未設定、または iidxId が空の場合は false。
 */
export function isBlockedIidxId(iidxId: string | null | undefined): boolean {
  if (!iidxId) return false;
  const list = process.env.BLOCKED_IIDX_ID_HASHES;
  if (!list) return false;
  const blocked = new Set(
    list
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  return blocked.has(hashIidxId(iidxId));
}
