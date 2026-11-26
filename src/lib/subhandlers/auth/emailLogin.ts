import type { NextApiRequest } from "next";
import { err, ok } from "@/middlewares/api/apiResult";
import { isValidEmail, normalizeEmail } from "@/utils/common/email";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";
import { sendEmailSignInLink } from "@/lib/firebase/identityToolkit";
import { mapIdentityToolkitError } from "./_errors";
import type { HandleOutcome } from "./_shared";

/**
 * 確認メールのリンク先（BPIM 側の完了ページ）の絶対 URL を組み立てる。
 * intent は Firebase が付与する mode パラメータと衝突しないよう別名にしている。
 *
 * @param intent - 完了時の処理種別（`login` / `link`）
 */
export function emailLinkContinueUrl(intent: "login" | "link" | "change") {
  const base = (process.env.BASEURL ?? "").replace(/\/+$/, "");
  return `${base}/auth/email-link?intent=${intent}`;
}

/** 外部アプリ（BPIM2 Camera）の確認メールの戻り先として受け付けるパス。ここ以外へは飛ばさない */
const EXTERNAL_CONTINUE_PATH = "/signin.html";

/**
 * 外部アプリが、確認メールのリンクの戻り先に自分の完了ページを指定したときの検証。
 * 許可したオリジン（環境変数 EMAIL_LINK_ALLOWED_ORIGINS、カンマ区切り）の /signin.html だけを受け付ける
 * （メールのリンクを、任意のサイトへ飛ばせてしまわないため）。受け付けるのは returnTo（同じオリジン内のパス）だけ。
 * 受け付けられなければ null。
 */
export function externalContinueUrl(
  raw: unknown,
  allowedOrigins: string = process.env.EMAIL_LINK_ALLOWED_ORIGINS ?? "",
): string | null {
  if (typeof raw !== "string") return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const allowed = allowedOrigins
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  if (!allowed.includes(url.origin) || url.pathname !== EXTERNAL_CONTINUE_PATH) return null;
  const returnTo = url.searchParams.get("returnTo") ?? "/";
  const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
  return `${url.origin}${EXTERNAL_CONTINUE_PATH}?returnTo=${encodeURIComponent(safeReturnTo)}`;
}

function clientIp(req: NextApiRequest): string | undefined {
  const forwarded = req.headers["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return first?.trim() || req.socket.remoteAddress || undefined;
}

/**
 * POST /api/v2/auth/magic-link（未ログイン）
 * 登録有無に関わらず同じ応答を返す（登録済みアドレスの列挙を防ぐ）。Turnstile 検証に通ったリクエストのみ送信する。
 */
export async function handleSendMagicLink(
  req: NextApiRequest,
): Promise<HandleOutcome<{ sent: true }>> {
  const base = { targetUserId: "", viewerId: null };
  const { email, turnstileToken, continueUrl } = (req.body ?? {}) as {
    email?: unknown;
    turnstileToken?: unknown;
    /** 外部アプリ（Camera）の完了ページ。省略すると BPIM 本体の完了ページ */
    continueUrl?: unknown;
  };

  if (typeof email !== "string" || !isValidEmail(email)) {
    return { result: err(400, "メールアドレスの形式が正しくありません"), ...base };
  }

  // 戻り先の指定があれば、許可したものだけ受け付ける（先に弾く。Turnstile の検証を使い捨てにしない）
  const external = continueUrl === undefined ? null : externalContinueUrl(continueUrl);
  if (continueUrl !== undefined && external === null) {
    return { result: err(400, "確認メールの戻り先が許可されていません"), ...base };
  }

  const verified = await verifyTurnstileToken(
    typeof turnstileToken === "string" ? turnstileToken : "",
    clientIp(req),
  );
  if (!verified) {
    return { result: err(403, "ボット確認に失敗しました。再度お試しください"), ...base };
  }

  try {
    await sendEmailSignInLink(normalizeEmail(email), external ?? emailLinkContinueUrl("login"));
    return { result: ok({ sent: true as const }), ...base };
  } catch (error: unknown) {
    return { result: mapIdentityToolkitError(error), ...base };
  }
}
