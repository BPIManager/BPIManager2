"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Link2, Mail, ShieldCheck } from "lucide-react";
import {
  GoogleIcon,
  LineIcon,
  XIcon,
} from "@/components/partials/common/Auth/ProviderIcons";
import {
  GoogleAuthProvider,
  linkWithPopup,
  OAuthProvider,
  TwitterAuthProvider,
  type AuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EmailLoginModal, {
  type EmailModalMode,
} from "@/components/partials/modal/EmailLogin";
import { useUser } from "@/contexts/users/UserContext";
import { useTranslation } from "@/hooks/common/useTranslation";
import { useLinkedAccounts } from "@/hooks/auth/useLinkedAccounts";
import { unlinkProvider } from "@/services/swr/auth/linkedAccounts";
import {
  EMAIL_PROVIDER_ID,
  type LinkedAccount,
} from "@/types/auth/linkedAccounts";
import type { TranslationKey } from "@/lib/i18n/translations";

interface SocialProvider {
  providerId: string;
  labelKey: TranslationKey;
  Icon: (props: { className?: string }) => React.JSX.Element;
  create: () => AuthProvider;
}

const SOCIAL_PROVIDERS: SocialProvider[] = [
  {
    providerId: "google.com",
    labelKey: "settings.linked.provider.google",
    Icon: GoogleIcon,
    create: () => new GoogleAuthProvider(),
  },
  {
    providerId: "twitter.com",
    labelKey: "settings.linked.provider.twitter",
    Icon: XIcon,
    create: () => new TwitterAuthProvider(),
  },
  {
    providerId: "oidc.line",
    labelKey: "settings.linked.provider.line",
    Icon: LineIcon,
    create: () => new OAuthProvider("oidc.line"),
  },
];

const IGNORED_ERROR_CODES = ["auth/popup-closed-by-user", "auth/cancelled-popup-request"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 連携アカウントの管理モーダル。SNS の追加・解除、メールアドレスの追加・変更・解除を扱う。
 * 最後の1件の解除は API 側でも拒否されるため、UI ではボタンを無効化して理由を示す。
 */
export default function LinkedAccountsModal({ open, onOpenChange }: Props) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] sm:max-w-lg flex-col overflow-hidden rounded-2xl border-bpim-border bg-bpim-bg p-0 shadow-2xl">
        <DialogHeader className="shrink-0 border-b border-bpim-border px-6 py-4">
          <div className="flex items-center gap-3">
            <Link2 className="h-5 w-5 text-bpim-muted" />
            <DialogTitle className="text-lg font-bold tracking-tight text-bpim-text">
              {t("settings.linked.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-bpim-muted">
            {t("settings.linked.desc")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <LinkedAccountsList />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** モーダルが開いている間だけマウントされ、開くたびに最新の連携状態を取得する */
function LinkedAccountsList() {
  const { t } = useTranslation();
  const { fbUser } = useUser();
  const { accounts, isLoading, refresh } = useLinkedAccounts();
  const [busyProviderId, setBusyProviderId] = useState<string | null>(null);
  const [emailModal, setEmailModal] = useState<EmailModalMode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const linkedIds = new Set(accounts.map((a) => a.providerId));
  const emailAccount: LinkedAccount | undefined = accounts.find(
    (a) => a.providerId === EMAIL_PROVIDER_ID,
  );
  const isLastMethod = accounts.length <= 1;

  const handleLinkSocial = async (provider: SocialProvider) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setBusyProviderId(provider.providerId);
    setErrorMessage(null);
    try {
      await linkWithPopup(currentUser, provider.create());
      await refresh();
      toast.success(t("settings.linked.linked"));
    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? "";
      if (IGNORED_ERROR_CODES.includes(code)) return;
      if (code === "auth/credential-already-in-use") {
        setErrorMessage(t("settings.linked.inUse"));
      } else {
        console.error("Link provider failed:", code);
        setErrorMessage(t("settings.linked.failed"));
      }
    } finally {
      setBusyProviderId(null);
    }
  };

  const handleUnlink = async (providerId: string) => {
    if (!fbUser) return;
    setBusyProviderId(providerId);
    setErrorMessage(null);
    try {
      await unlinkProvider(fbUser, providerId);
      // 連携解除はサーバー側で行われるため、ローカルのユーザー情報を取り直して表示を揃える
      await auth.currentUser?.reload();
      await refresh();
      toast.success(t("settings.linked.unlinked"));
    } catch (error: unknown) {
      const apiStatus = (error as { status?: number }).status;
      setErrorMessage(
        apiStatus && apiStatus < 500 && error instanceof Error
          ? error.message
          : t("settings.linked.failed"),
      );
    } finally {
      setBusyProviderId(null);
    }
  };

  const removeButton = (providerId: string) => (
    <Button
      variant="outline"
      size="sm"
      className="h-8 rounded-lg border-bpim-danger px-3 text-xs text-bpim-danger"
      disabled={isLastMethod || busyProviderId !== null}
      title={isLastMethod ? t("settings.linked.lastMethodHint") : undefined}
      onClick={() => handleUnlink(providerId)}
    >
      {t("settings.linked.remove")}
    </Button>
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        {errorMessage && <div role="alert" className="rounded-lg border border-bpim-danger/30 bg-bpim-danger/8 px-4 py-3 text-xs font-medium text-bpim-danger">{errorMessage}</div>}
        <div className="flex items-center justify-between gap-4 rounded-lg border border-bpim-border bg-bpim-surface-2/40 px-4 py-3">
          <div className="flex min-w-0 flex-col">
            <span className="flex items-center gap-2 text-sm font-bold text-bpim-text">
              <Mail className="h-4 w-4 text-bpim-muted" />
              {t("settings.linked.provider.email")}
            </span>
            {emailAccount?.email && (
              <span className="truncate text-xs text-bpim-muted">{emailAccount.email}</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {emailAccount ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-bpim-primary px-3 text-xs"
                  disabled={busyProviderId !== null}
                  onClick={() => setEmailModal("change")}
                >
                  {t("settings.linked.change")}
                </Button>
                {removeButton(EMAIL_PROVIDER_ID)}
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg border-bpim-primary px-3 text-xs"
                disabled={isLoading || !fbUser}
                onClick={() => setEmailModal("link")}
              >
                {t("settings.linked.add")}
              </Button>
            )}
          </div>
        </div>

        {SOCIAL_PROVIDERS.map((provider) => {
          const isLinked = linkedIds.has(provider.providerId);
          return (
            <div
              key={provider.providerId}
              className="flex items-center justify-between gap-4 rounded-lg border border-bpim-border bg-bpim-surface-2/40 px-4 py-3"
            >
              <span className="flex items-center gap-2 text-sm font-bold text-bpim-text">
                <provider.Icon className="h-4 w-4 text-bpim-muted" />
                {t(provider.labelKey)}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                {isLinked ? (
                  removeButton(provider.providerId)
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-bpim-primary px-3 text-xs"
                    disabled={isLoading || busyProviderId !== null}
                    onClick={() => handleLinkSocial(provider)}
                  >
                    {t("settings.linked.add")}
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        <div className="flex flex-col gap-2 rounded-lg border border-bpim-border bg-bpim-surface-2/40 px-4 py-3">
          <div className="flex items-center gap-2 text-bpim-primary">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-bold">{t("settings.linked.security.title")}</span>
          </div>
          <p className="text-xs leading-relaxed text-bpim-muted">{t("settings.linked.security.body")}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <Link
              href="https://app.notion.com/p/3289989ca87a80dd9a57de3c63c71e50"
              target="_blank"
              className="underline underline-offset-2 text-bpim-muted hover:text-bpim-text"
            >
              {t("settings.linked.security.terms")}
            </Link>
            <Link
              href="https://app.notion.com/p/3289989ca87a80b9b020edb6cb664261"
              target="_blank"
              className="underline underline-offset-2 text-bpim-muted hover:text-bpim-text"
            >
              {t("settings.linked.security.privacy")}
            </Link>
          </div>
        </div>
      </div>

      {emailModal && (
        <EmailLoginModal
          open
          mode={emailModal}
          onOpenChange={(open) => {
            if (!open) setEmailModal(null);
          }}
        />
      )}
    </>
  );
}
