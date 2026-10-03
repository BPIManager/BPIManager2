import { err } from "@/middlewares/api/apiResult";
import { IdentityToolkitError } from "@/lib/firebase/identityToolkitError";
import type { HandlerResult } from "@/types/api";

/**
 * Identity Toolkit のエラーを HTTP ステータス付きの結果へ変換する。
 * 送信先のメールアドレスは応答・ログのどちらにも含めない。
 *
 * @param error - 捕捉したエラー
 */
export function mapIdentityToolkitError(error: unknown): HandlerResult<never> {
  if (error instanceof IdentityToolkitError) {
    if (error.code.startsWith("TOO_MANY_ATTEMPTS")) {
      return err(429, "送信回数の上限に達しました。しばらく待ってから再度お試しください");
    }
    if (error.code === "INVALID_EMAIL") {
      return err(400, "メールアドレスの形式が正しくありません");
    }
    if (error.code === "EMAIL_EXISTS") {
      return err(409, "このメールアドレスは既に使用されています");
    }
    console.error("Identity Toolkit error:", error.status, error.code);
  } else {
    console.error("Identity Toolkit call failed:", error instanceof Error ? error.name : "unknown");
  }
  return err(500, "Internal Server Error");
}
