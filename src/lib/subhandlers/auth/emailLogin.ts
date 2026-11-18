import type { NextApiRequest } from "next";
import { err, ok } from "@/middlewares/api/apiResult";
import { normalizeEmail } from "@/utils/common/email";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";
import { sendEmailSignInLink } from "@/lib/firebase/identityToolkit";
import { mapIdentityToolkitError } from "./_errors";
import type { HandleOutcome } from "./_shared";
import { parseInput } from "@/lib/validation/parse";
import { emailBodySchema } from "@/schemas/auth/email";

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
  const { turnstileToken } = (req.body ?? {}) as {
    turnstileToken?: unknown;
  };

  // 画面に表示される errorMessage は従来の日本語のまま、原因（errorDetails）は英語で返す
  const emailInput = parseInput(emailBodySchema, req.body ?? {}, {
    in: "body",
    message: "メールアドレスの形式が正しくありません",
  });
  if (!emailInput.success) {
    return { result: emailInput.result, ...base };
  }
  const { email } = emailInput.data;

  const verified = await verifyTurnstileToken(
    typeof turnstileToken === "string" ? turnstileToken : "",
    clientIp(req),
  );
  if (!verified) {
    return { result: err(403, "ボット確認に失敗しました。再度お試しください"), ...base };
  }

  try {
    await sendEmailSignInLink(normalizeEmail(email), emailLinkContinueUrl("login"));
    return { result: ok({ sent: true as const }), ...base };
  } catch (error: unknown) {
    return { result: mapIdentityToolkitError(error), ...base };
  }
}
