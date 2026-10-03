import crypto from "crypto";

/**
 * APIキー・OAuthクライアントシークレットをDBに保存・照合するためのハッシュ(SHA-256 hex)。
 * 平文を保存しないため、DB流出時にそのまま有効な資格情報として使われない。
 * MySQLの `SHA2(x, 256)` と同じ値になるため、既存行の移行に使える。
 */
export function hashCredential(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
