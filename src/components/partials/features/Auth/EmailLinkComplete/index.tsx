"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/router";
import {
  applyActionCode,
  EmailAuthProvider,
  isSignInWithEmailLink,
  linkWithCredential,
  signInWithEmailLink,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/common/useTranslation";
import { PENDING_EMAIL_STORAGE_KEY } from "@/components/partials/modal/EmailLogin";
import { syncLinkedAccounts } from "@/services/swr/auth/linkedAccounts";
import { normalizeEmail, isValidEmail } from "@/utils/common/email";
import type { TranslationKey } from "@/lib/i18n/translations";

type Intent = "login" | "link" | "change";
type Phase = "processing" | "needEmail" | "done" | "error";

const DONE_KEYS: Record<Intent, TranslationKey> = {
  login: "email.complete.doneLogin",
  link: "email.complete.doneLink",
  change: "email.complete.doneChange",
};

const readIntent = (href: string): Intent => {
  const value = new URL(href).searchParams.get("intent");
  return value === "link" || value === "change" ? value : "login";
};

const readPendingEmail = (): string | null => {
  try {
    return localStorage.getItem(PENDING_EMAIL_STORAGE_KEY);
  } catch {
    return null;
  }
};

const clearPendingEmail = () => {
  try {
    localStorage.removeItem(PENDING_EMAIL_STORAGE_KEY);
  } catch {
    // 保存領域が使えない環境では何もしない
  }
};

/**
 * 確認メールのリンク先。intent に応じてサインイン・メール連携・メール変更を完了させる。
 * メール連携（link）は、リンクを開いた端末でサインイン済みである必要がある。
 */
export default function EmailLinkComplete() {
  const { t } = useTranslation();
  const router = useRouter();
  const startedRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("processing");
  const [intent, setIntent] = useState<Intent>("login");
  const [errorKey, setErrorKey] = useState<TranslationKey>("email.complete.error");
  const [emailInput, setEmailInput] = useState("");

  const fail = useCallback((key: TranslationKey) => {
    setErrorKey(key);
    setPhase("error");
  }, []);

  const complete = useCallback(
    async (email: string | null) => {
      // ページ読み込み直後は認証状態の復元が終わっておらず currentUser が null になるため、確定を待つ
      await auth.authStateReady();
      const href = window.location.href;
      const currentIntent = readIntent(href);
      setIntent(currentIntent);

      const finish = async () => {
        clearPendingEmail();
        // 同期は補助的な処理のため、失敗してもサインイン・連携の完了は取り消さない
        if (auth.currentUser) {
          await syncLinkedAccounts(auth.currentUser).catch((e: unknown) =>
            console.error("Linked accounts sync failed:", e),
          );
        }
        setPhase("done");
        router.replace(currentIntent === "login" ? "/" : "/settings");
      };

      try {
        if (currentIntent === "change") {
          // アドレス変更の確認コード。Firebase 側で既に適用済みの場合は無効扱いになるため、その際は同期だけ行う
          const oobCode = new URL(href).searchParams.get("oobCode");
          if (oobCode) {
            try {
              await applyActionCode(auth, oobCode);
            } catch (error: unknown) {
              if ((error as { code?: string }).code !== "auth/invalid-action-code") throw error;
            }
          }
          await auth.currentUser?.reload();
          await finish();
          return;
        }

        if (!isSignInWithEmailLink(auth, href) || !email) {
          fail("email.complete.invalidLink");
          return;
        }

        if (currentIntent === "link") {
          if (!auth.currentUser) {
            fail("email.complete.notSignedIn");
            return;
          }
          // 解除済みのメール連携が端末に古い状態で残っていると provider-already-linked になるため、連携前に最新化する
          await auth.currentUser.reload();
          await linkWithCredential(
            auth.currentUser,
            EmailAuthProvider.credentialWithLink(email, href),
          );
        } else {
          await signInWithEmailLink(auth, email, href);
        }
        await finish();
      } catch (error: unknown) {
        const code = (error as { code?: string }).code ?? "";
        if (code === "auth/email-already-in-use" || code === "auth/credential-already-in-use") {
          fail("email.complete.emailInUse");
        } else if (code.startsWith("auth/invalid-action-code") || code.startsWith("auth/expired-action-code")) {
          fail("email.complete.invalidLink");
        } else {
          console.error("Email link completion failed:", code);
          fail("email.complete.error");
        }
      }
    },
    [fail, router],
  );

  useEffect(() => {
    // StrictMode の二重実行で確認コードを二度消費しないよう、初回マウントの1回だけ判定する
    if (startedRef.current) return;
    startedRef.current = true;

    const currentIntent = readIntent(window.location.href);
    if (currentIntent === "change") {
      void complete(null);
      return;
    }
    const pending = readPendingEmail();
    if (pending) {
      void complete(pending);
    } else {
      setIntent(currentIntent);
      setPhase("needEmail");
    }
  }, [complete]);

  const handleSubmitEmail = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValidEmail(emailInput)) {
      fail("email.modal.invalid");
      return;
    }
    setPhase("processing");
    void complete(normalizeEmail(emailInput));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bpim-bg px-4 text-bpim-text">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-bpim-border bg-bpim-surface p-6 text-center">
        {phase === "processing" && (
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" className="text-bpim-text" />
            <p className="text-sm text-bpim-muted">{t("email.complete.processing")}</p>
          </div>
        )}

        {phase === "needEmail" && (
          <form onSubmit={handleSubmitEmail} className="flex flex-col gap-4">
            <p className="text-xs leading-relaxed text-bpim-muted">{t("email.complete.needEmail")}</p>
            <Input
              type="email"
              autoComplete="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="h-10 bg-bpim-surface-2/60 border-bpim-border"
            />
            <Button type="submit" className="h-11 rounded-xl font-bold">
              {t("email.modal.submit")}
            </Button>
          </form>
        )}

        {phase === "done" && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-bpim-success" />
            <p className="text-sm font-bold text-bpim-success">{t(DONE_KEYS[intent])}</p>
          </div>
        )}

        {phase === "error" && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-10 w-10 text-bpim-danger" />
            <p className="text-sm font-bold text-bpim-danger">{t(errorKey)}</p>
            <Button variant="outline" className="h-10 rounded-xl" onClick={() => router.replace("/")}>
              {t("common.error.backHome")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
