"use client";

import { useState, type FormEvent } from "react";
import { Check, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Turnstile from "@/components/partials/common/Turnstile";
import { useUser } from "@/contexts/users/UserContext";
import { useTranslation } from "@/hooks/common/useTranslation";
import { requestEmailLink, requestMagicLink } from "@/services/swr/auth/linkedAccounts";
import { isValidEmail, normalizeEmail } from "@/utils/common/email";
import type { TranslationKey } from "@/lib/i18n/translations";

/**
 * login: 未ログインでのマジックリンク送信（サインイン兼新規登録）
 * link: ログイン中のユーザーへメールアドレスを追加
 * change: 既に連携済みのメールアドレスを変更
 */
export type EmailModalMode = "login" | "link" | "change";

/** 送信したアドレスを、リンクを開いた完了ページで使えるよう保存する（同一端末の場合のみ） */
export const PENDING_EMAIL_STORAGE_KEY = "bpim.emailLink.pending";

const TITLE_KEYS = {
  login: "email.modal.title.login",
  link: "email.modal.title.link",
  change: "email.modal.title.change",
} as const satisfies Record<EmailModalMode, TranslationKey>;

const DESC_KEYS = {
  login: "email.modal.desc.login",
  link: "email.modal.desc.link",
  change: "email.modal.desc.change",
} as const satisfies Record<EmailModalMode, TranslationKey>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: EmailModalMode;
}

/**
 * メールアドレスを入力して確認リンクを送るモーダル。Turnstile の検証を通したリクエストのみ送信される。
 */
export default function EmailLoginModal({ open, onOpenChange, mode }: Props) {
  const { t } = useTranslation();
  const { fbUser } = useUser();

  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  // Turnstile のトークンは使い捨てのため、送信のたびにウィジェットを作り直す
  const [widgetKey, setWidgetKey] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEmail("");
    setTurnstileToken("");
    setWidgetKey((k) => k + 1);
    setStatus("idle");
    setErrorMessage(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isValidEmail(email)) {
      setErrorMessage(t("email.modal.invalid"));
      return;
    }
    if (!turnstileToken) {
      setErrorMessage(t("email.modal.captchaRequired"));
      return;
    }

    const normalized = normalizeEmail(email);
    setStatus("sending");
    try {
      if (mode === "login") {
        await requestMagicLink({ email: normalized, turnstileToken });
      } else {
        if (!fbUser) throw new Error("Not signed in");
        await requestEmailLink(fbUser, { email: normalized, turnstileToken });
      }
      try {
        localStorage.setItem(PENDING_EMAIL_STORAGE_KEY, normalized);
      } catch {
        // 保存できない環境（プライベートモード等）では完了ページで入力し直してもらう
      }
      setStatus("sent");
    } catch (error: unknown) {
      // API からの業務エラー（重複・送信上限など）は理由を表示する。想定外の失敗は汎用文言にする
      const apiStatus = (error as { status?: number }).status;
      setErrorMessage(
        apiStatus && apiStatus < 500 && error instanceof Error
          ? error.message
          : t("email.modal.error"),
      );
      setTurnstileToken("");
      setWidgetKey((k) => k + 1);
      setStatus("idle");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border-bpim-border bg-bpim-bg p-0 shadow-2xl">
        <DialogHeader className="border-b border-bpim-border px-6 py-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-bpim-muted" />
            <DialogTitle className="text-lg font-bold tracking-tight text-bpim-text">
              {t(TITLE_KEYS[mode])}
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">{t(DESC_KEYS[mode])}</DialogDescription>
        </DialogHeader>

        {status === "sent" ? (
          <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
            <Check className="h-8 w-8 text-bpim-success" />
            <p className="text-sm font-bold text-bpim-text">{t("email.modal.sentTitle")}</p>
            <p className="text-xs leading-relaxed text-bpim-muted">{t("email.modal.sentBody")}</p>
            <Button
              variant="outline"
              className="mt-2 h-10 rounded-xl"
              onClick={() => handleOpenChange(false)}
            >
              OK
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-6">
            <p className="text-xs leading-relaxed text-bpim-muted">{t(DESC_KEYS[mode])}</p>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="email-login-input"
                className="text-[11px] font-bold uppercase text-bpim-muted"
              >
                {t("email.modal.label")}
              </label>
              <Input
                id="email-login-input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 bg-bpim-surface-2/60 border-bpim-border focus-visible:ring-blue-500"
              />
            </div>

            <Turnstile key={widgetKey} onVerify={setTurnstileToken} />

            {errorMessage && (
              <div role="alert" className="rounded-lg border border-bpim-danger/30 bg-bpim-danger/8 px-4 py-3 text-xs font-medium text-bpim-danger">{errorMessage}</div>
            )}

            <Button
              type="submit"
              disabled={status === "sending"}
              className="h-11 rounded-xl font-bold"
            >
              {status === "sending" ? t("email.modal.sending") : t("email.modal.submit")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
