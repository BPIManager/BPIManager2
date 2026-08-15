"use client";

import { useState } from "react";
import { useFollowInvite } from "@/hooks/users/useFollowInvite";
import ActionConfirmDialog from "@/components/partials/modal/Confirmation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, RefreshCw } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslation } from "@/hooks/common/useTranslation";

/**
 * 非公開設定中のみ表示する、フォロー招待URLの発行/再発行セクション。
 *
 * `AccountSettings`モーダルの「プロフィールを公開」トグルの直下に置く
 * （表示可否はトグルの現在値=`formData.isPublic`で呼び出し元が判断する）。
 */
export default function FollowInviteSection() {
  const { token, regenerate, isLoading } = useFollowInvite();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { t } = useTranslation();

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
    <div className="flex flex-col gap-3 rounded-xl border border-bpim-border bg-bpim-surface-2/60 p-4">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-bold uppercase text-bpim-muted">
          {t("settings.followInvite.title")}
        </p>
        <p className="text-[11px] text-bpim-muted">
          {t("settings.followInvite.desc")}
        </p>
      </div>

      <div className="flex items-center">
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
            type="button"
            variant="secondary"
            className="h-9 rounded-none border-y border-bpim-border px-3 hover:bg-bpim-overlay"
            onClick={copyToClipboard}
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          className="h-9 shrink-0 rounded-l-none px-4 text-xs font-bold"
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
