import { createHmac } from "crypto";
import { normalizeEmail } from "@/utils/common/email";

/**
 * 正規化済みメールアドレスの HMAC-SHA256（hex）を返す。鍵は環境変数 EMAIL_HASH_PEPPER。
 * 鍵が未設定の場合は例外を投げ、ハッシュ無しで処理が進まないようにする。
 *
 * @param email - 入力のメールアドレス（内部で正規化する）
 * @returns 64文字の hex 文字列
 */
export function hashEmail(email: string): string {
  const pepper = process.env.EMAIL_HASH_PEPPER;
  if (!pepper) throw new Error("EMAIL_HASH_PEPPER is not set");
  return createHmac("sha256", pepper).update(normalizeEmail(email)).digest("hex");
}
