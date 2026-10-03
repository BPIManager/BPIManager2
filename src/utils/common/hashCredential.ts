import crypto from "crypto";

/**
 * APIキー・OAuthクライアントシークレットの保存・照合用ハッシュ（SHA-256 hex）。平文を保存しないため DB 流出時にそのまま使われない。
 * MySQL の SHA2(x, 256) と同じ値になるため既存行の移行に使える。
 */
export function hashCredential(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
