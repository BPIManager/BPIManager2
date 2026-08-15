"use client";

import { useState } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { useFollowInvite } from "@/hooks/users/useFollowInvite";
import ActionConfirmDialog from "@/components/partials/modal/Confirmation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link2, Copy, RefreshCw } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function FollowInviteUi() {
  const { user } = useUser();
  const { token, regenerate, isLoading } = useFollowInvite();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { t } = useTranslation();

  if (!user || user.isPublic) return null;

  const inviteUrl = token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${token}`
    : "";

  const executeGenerate = async () => {
    try {
      await regenerate();
      toast.success(t("settings.followInvite.issued"));
      setIsConfirmOpen(false);
    } catch {
      toast.error(t("settings.followInvite.failed"));
    }
  };

  const handleGenerateClick = () => {
    if (token) {
      setIsConfirmOpen(true);
    } else {
      executeGenerate();
    }
  };

  const copyToClipboard = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      toast.success(t("settings.followInvite.copied"));
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-6 rounded-xl border border-bpim-border bg-bpim-bg p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-bpim-primary">
          <Link2 className="h-4 w-4" />
          <span className="font-bold">{t("settings.followInvite.title")}</span>
        </div>
        <p className="text-sm text-bpim-muted">
          {t("settings.followInvite.desc")}
        </p>
      </div>

      <div className="flex w-full flex-col gap-2 md:w-auto">
        <div className="flex w-full items-center md:w-112.5">
          <Input
            value={inviteUrl}
            placeholder={
              isLoading ? "Loading..." : t("settings.followInvite.notIssued")
            }
            readOnly
            className="h-9 flex-1 rounded-r-none border-bpim-border bg-bpim-bg/40 font-mono text-xs focus-visible:ring-0"
          />
          {token && (
            <Button
              variant="secondary"
              className="h-9 rounded-none border-y border-bpim-border px-3 hover:bg-bpim-overlay"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          <Button
            className="h-9 rounded-l-none px-6 font-bold"
            disabled={isLoading}
            onClick={handleGenerateClick}
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : token ? (
              <RefreshCw className="mr-1 h-3 w-3" />
            ) : (
              t("settings.followInvite.issue")
            )}
            {token && t("settings.followInvite.reissue")}
          </Button>
        </div>
      </div>

      <ActionConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeGenerate}
        isLoading={isLoading}
        title={t("settings.followInvite.dialogTitle")}
        description={t("settings.followInvite.dialogDesc")}
        confirmLabel={t("common.reissue")}
        isDestructive
      />
    </div>
  );
}
