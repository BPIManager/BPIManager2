"use client";

import { useState } from "react";
import { ChevronLeft, LockIcon, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRememberedAccounts } from "@/hooks/auth/useRememberedAccounts";
import { authActions } from "@/lib/firebase/auth";
import { useTranslation } from "@/hooks/common/useTranslation";
import { RememberedAccount } from "@/types/auth/rememberedAccount";

const PROVIDER_REAUTH: Record<
  RememberedAccount["provider"],
  () => Promise<unknown>
> = {
  "google.com": () => authActions.signInWithGoogle(),
  "twitter.com": () => authActions.signInWithTwitter(),
  "oidc.line": () => authActions.signInWithLINE(),
};

interface Props {
  currentUid?: string;
  onBack: () => void;
  onRequestAddAccount: () => void;
  onSwitched: () => void;
}

const AccountSwitcher = ({
  currentUid,
  onBack,
  onRequestAddAccount,
  onSwitched,
}: Props) => {
  const { t } = useTranslation();
  const { accounts, removeAccount } = useRememberedAccounts();
  const [switchingUid, setSwitchingUid] = useState<string | null>(null);

  const handleSwitch = async (account: RememberedAccount) => {
    if (account.uid === currentUid || switchingUid) return;
    setSwitchingUid(account.uid);
    try {
      await PROVIDER_REAUTH[account.provider]();
      onSwitched();
    } catch {
      toast.error(t("nav.switchAccountFailed"));
    } finally {
      setSwitchingUid(null);
    }
  };

  return (
    <div className="flex flex-col p-1">
      <button
        onClick={onBack}
        className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-bold text-bpim-muted hover:bg-bpim-overlay"
      >
        <ChevronLeft className="h-3 w-3" />
        {t("common.back")}
      </button>

      <div className="flex max-h-60 flex-col gap-0.5 overflow-y-auto py-1">
        {accounts.length === 0 && (
          <p className="px-3 py-2 text-[11px] text-bpim-muted">
            {t("nav.noRememberedAccounts")}
          </p>
        )}
        {accounts.map((account) => {
          const isCurrent = account.uid === currentUid;
          return (
            <div
              key={account.uid}
              className="group flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-bpim-overlay"
            >
              <button
                onClick={() => handleSwitch(account)}
                disabled={isCurrent || switchingUid !== null}
                className="flex flex-1 items-center gap-2 text-left disabled:opacity-50"
              >
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage
                    src={account.avatarUrl}
                    alt={account.displayName}
                  />
                  <AvatarFallback className="bg-bpim-overlay text-[10px] text-bpim-text">
                    {account.displayName.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-xs text-bpim-text">
                  {account.displayName}
                  {isCurrent && (
                    <span className="ml-1 text-[10px] text-bpim-muted">
                      ({t("nav.currentAccount")})
                    </span>
                  )}
                </span>
                {!account.isPublic && (
                  <LockIcon className="h-3 w-3 shrink-0 text-bpim-muted" />
                )}
              </button>
              <button
                onClick={() => removeAccount(account.uid)}
                aria-label={t("common.delete")}
                className="shrink-0 rounded p-0.5 text-bpim-muted opacity-0 transition-opacity hover:bg-bpim-danger/10 hover:text-bpim-danger group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={onRequestAddAccount}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold text-bpim-primary hover:bg-bpim-primary/10"
      >
        <Plus className="h-3 w-3" />
        {t("nav.addAccount")}
      </button>
    </div>
  );
};

export default AccountSwitcher;
