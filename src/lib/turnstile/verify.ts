const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Cloudflare Turnstile のトークンをサーバー側で検証する。
 * シークレットが未設定、トークンが空、通信失敗の場合はすべて未検証（false）として扱う。
 *
 * @param token - クライアントの Turnstile ウィジェットが発行したトークン
 * @param remoteIp - 利用者の IP（任意。検証精度の向上に使われる）
 * @returns 検証に成功した場合 true
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(SITEVERIFY_URL, { method: "POST", body });
    if (!res.ok) return false;
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}
