import { FIREBASE_WEB_API_KEY } from "@/constants/firebase/webApiKey";
import { adminAuth } from "@/lib/firebase/admin";
import { IdentityToolkitError } from "@/lib/firebase/identityToolkitError";

const IDENTITY_TOOLKIT_URL = "https://identitytoolkit.googleapis.com/v1";

async function postIdentityToolkit(
  path: string,
  body: Record<string, unknown>,
  bearerToken?: string,
): Promise<void> {
  const url = `${IDENTITY_TOOLKIT_URL}/${path}?key=${FIREBASE_WEB_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (res.ok) return;

  const json = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
  };
  throw new IdentityToolkitError(
    res.status,
    json.error?.message ?? "UNKNOWN",
  );
}

/**
 * メールアドレスでのサインイン（マジックリンク）メールを Firebase 経由で送信する。
 * 未登録のアドレスでも送信され、リンクを開いた時点で新規アカウントが作られる。
 *
 * @param email - 正規化済みのメールアドレス
 * @param continueUrl - リンク後に遷移させる BPIM 側のページ URL
 */
export async function sendEmailSignInLink(
  email: string,
  continueUrl: string,
): Promise<void> {
  await postIdentityToolkit("accounts:sendOobCode", {
    requestType: "EMAIL_SIGNIN",
    email,
    continueUrl,
    canHandleCodeInApp: true,
  });
}

/**
 * 既にメールアドレスを持つユーザーのアドレス変更確認メールを送信する。
 * 確認が完了するまで Firebase 上のアドレスは変わらない。
 *
 * @param idToken - 変更対象ユーザーの Firebase ID トークン
 * @param newEmail - 変更先のメールアドレス（正規化済み）
 * @param continueUrl - 確認後に遷移させる BPIM 側のページ URL
 */
export async function sendEmailChangeLink(
  idToken: string,
  newEmail: string,
  continueUrl: string,
): Promise<void> {
  await postIdentityToolkit("accounts:sendOobCode", {
    requestType: "VERIFY_AND_CHANGE_EMAIL",
    idToken,
    newEmail,
    continueUrl,
    canHandleCodeInApp: true,
  });
}

/**
 * ユーザーから指定のログインプロバイダ（google.com / twitter.com / oidc.line / password）を削除する。
 * Admin SDK には連携解除 API が無いため、サービスアカウントの権限で accounts:update を呼ぶ。
 *
 * @param uid - 対象ユーザーの Firebase uid
 * @param providerId - 削除する providerId
 */
export async function deleteProviderFromUser(
  uid: string,
  providerId: string,
): Promise<void> {
  const credential = adminAuth.app.options.credential;
  if (!credential) throw new Error("Firebase Admin credential is not configured");
  const { access_token } = await credential.getAccessToken();

  await postIdentityToolkit(
    "accounts:update",
    { localId: uid, deleteProvider: [providerId] },
    access_token,
  );
}
