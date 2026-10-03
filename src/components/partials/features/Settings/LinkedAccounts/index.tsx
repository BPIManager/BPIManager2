"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Link2, Mail } from "lucide-react";
import {
  GoogleAuthProvider,
  linkWithPopup,
  OAuthProvider,
  TwitterAuthProvider,
  type AuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
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
  create: () => AuthProvider;
}

const SOCIAL_PROVIDERS: SocialProvider[] = [
  {
    providerId: "google.com",
    labelKey: "settings.linked.provider.google",
    create: () => new GoogleAuthProvider(),
  },
  {
    providerId: "twitter.com",
    labelKey: "settings.linked.provider.twitter",
    create: () => new TwitterAuthProvider(),
  },
  {
    providerId: "oidc.line",
    labelKey: "settings.linked.provider.line",
    create: () => new OAuthProvider("oidc.line"),
  },
];

const ERROR_CODES_IGNORED = ["auth/popup-closed-by-user", "auth/cancelled-popup-request"];

/**
 * 設定画面の「連携アカウント」。SNS の追加・解除、メールアドレスの追加・変更・解除を扱う。
 * 最後の1件の解除は API 側でも拒否されるため、UI ではボタンを無効化して理由を示す。
 */
export default function LinkedAccountsUi() {
  const { t } = useTranslation();
  const { fbUser } = useUser();
  const { accounts, isLoading, refresh } = useLinkedAccounts();
  const [busyProviderId, setBusyProviderId] = useState<string | null>(null);
  const [emailModal, setEmailModal] = useState<EmailModalMode | null>(null);

  const linkedIds = new Set(accounts.map((a) => a.providerId));
  const emailAccount: LinkedAccount | undefined = accounts.find(
    (a) => a.providerId === EMAIL_PROVIDER_ID,
  );
  const isLastMethod = accounts.length <= 1;

  const handleLinkSocial = async (provider: SocialProvider) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setBusyProviderId(provider.providerId);
    try {
      await linkWithPopup(currentUser, provider.create());
      await refresh();
      toast.success(t("settings.linked.linked"));
    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? "";
      if (ERROR_CODES_IGNORED.includes(code)) return;
      if (code === "auth/credential-already-in-use") {
        toast.error(t("settings.linked.inUse"));
      } else {
        console.error("Link provider failed:", code);
        toast.error(t("settings.linked.failed"));
      }
    } finally {
      setBusyProviderId(null);
    }
  };

  const handleUnlink = async (providerId: string) => {
    if (!fbUser) return;
    setBusyProviderId(providerId);
    try {
      await unlinkProvider(fbUser, providerId);
      // 連携解除はサーバー側で行われるため、ローカルのユーザー情報を取り直して表示を揃える
      await auth.currentUser?.reload();
      await refresh();
      toast.success(t("settings.linked.unlinked"));
    } catch (error: unknown) {
      const apiStatus = (error as { status?: number }).status;
      toast.error(
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
      className="h-8 rounded-lg px-3 text-xs"
      disabled={isLastMethod || busyProviderId !== null}
      title={isLastMethod ? t("settings.linked.lastMethodHint") : undefined}
      onClick={() => handleUnlink(providerId)}
    >
      {t("settings.linked.remove")}
    </Button>
  );

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-bpim-border bg-bpim-bg p-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-bpim-primary">
          <Link2 className="h-4 w-4" />
          <span className="font-bold">{t("settings.linked.title")}</span>
        </div>
        <p className="text-sm text-bpim-muted">{t("settings.linked.desc")}</p>
      </div>

      <div className="flex flex-col gap-3">
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
                  className="h-8 rounded-lg px-3 text-xs"
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
                className="h-8 rounded-lg px-3 text-xs"
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
              <span className="text-sm font-bold text-bpim-text">{t(provider.labelKey)}</span>
              <div className="flex shrink-0 items-center gap-2">
                {isLinked ? (
                  removeButton(provider.providerId)
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg px-3 text-xs"
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
      </div>

      {emailModal && (
        <EmailLoginModal
          open
          mode={emailModal}
          onOpenChange={(open) => {
            if (!open) {
              setEmailModal(null);
            }
          }}
        />
      )}
    </div>
  );
}
