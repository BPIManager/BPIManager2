"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import OAuthClientModal from "@/components/partials/modal/OAuthClient";
import { useTranslation } from "@/hooks/common/useTranslation";

/**
 * 設定画面の「MCP接続（OAuth）」入口。発行・再発行・削除の操作は管理モーダルに置く。
 */
export default function OAuthClientUi() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-bpim-border bg-bpim-bg p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-bpim-primary">
          <KeyRound className="h-4 w-4" />
          <span className="font-bold">{t("settings.oauthClient.title")}</span>
        </div>
        <p className="text-sm text-bpim-muted">{t("settings.oauthClient.desc")}</p>
      </div>
      <Button className="h-9 shrink-0 rounded-lg px-6 font-bold" onClick={() => setIsOpen(true)}>
        {t("settings.oauthClient.manage")}
      </Button>

      <OAuthClientModal open={isOpen} onOpenChange={setIsOpen} />
    </div>
  );
}
