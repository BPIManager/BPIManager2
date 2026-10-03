import type { User as FirebaseUser } from "firebase/auth";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";
import { unwrapApiResponse } from "@/services/swr/fetchV2";

const AUTH_PATH = `${API_V2_PREFIX}/auth`;

/**
 * 未ログインでマジックリンク（サインイン用メール）の送信を依頼する。
 *
 * @param body.email - 送信先メールアドレス
 * @param body.turnstileToken - Turnstile ウィジェットのトークン
 */
export async function requestMagicLink(body: {
  email: string;
  turnstileToken: string;
}): Promise<{ sent: true }> {
  const res = await authFetch(`${AUTH_PATH}/magic-link`, "POST", null, body);
  return unwrapApiResponse<{ sent: true }>(res);
}

/**
 * 連携中ユーザーのメールアドレス追加（未連携）または変更（連携済み）の確認メールを依頼する。
 *
 * @param fbUser - 操作するユーザー
 * @param body.email - 新しいメールアドレス
 * @param body.turnstileToken - Turnstile ウィジェットのトークン
 */
export async function requestEmailLink(
  fbUser: FirebaseUser,
  body: { email: string; turnstileToken: string },
): Promise<{ sent: true }> {
  const res = await authFetch(`${AUTH_PATH}/linked-accounts/email`, "POST", fbUser, body);
  return unwrapApiResponse<{ sent: true }>(res);
}

/**
 * ログイン手段を連携解除する。最後の1件は API 側で拒否される。
 *
 * @param fbUser - 操作するユーザー
 * @param providerId - 解除する providerId（google.com / twitter.com / oidc.line / password）
 */
export async function unlinkProvider(
  fbUser: FirebaseUser,
  providerId: string,
): Promise<{ removed: string }> {
  const res = await authFetch(
    `${AUTH_PATH}/linked-accounts/${encodeURIComponent(providerId)}`,
    "DELETE",
    fbUser,
  );
  return unwrapApiResponse<{ removed: string }>(res);
}
