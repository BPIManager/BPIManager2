"use client";

import { useState } from "react";
import { useApiKey } from "@/hooks/users/useAPIKey";
import { ActionConfirmDialog } from "../../Modal/Confirmation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Key, Copy, RefreshCw } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function ApiKeyUi() {
  const { keyInfo, generate, isLoading } = useApiKey();
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { t } = useTranslation();

  const executeGenerate = async () => {
    try {
      const key = await generate();
      setRawKey(key);
      toast.success(t("settings.apiKey.issued"), { duration: 10000 });
      setIsConfirmOpen(false);
    } catch (e) {
      toast.error(t("settings.apiKey.failed"));
    }
  };

  const handleGenerateClick = () => {
    keyInfo?.exists ? setIsConfirmOpen(true) : executeGenerate();
  };

  const copyToClipboard = () => {
    const text = rawKey || keyInfo?.key;
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success(t("settings.apiKey.copied"));
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-6 rounded-xl border border-bpim-border bg-bpim-bg p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-bpim-primary">
          <Key className="h-4 w-4" />
          <span className="font-bold">{t("settings.apiKey.title")}</span>
        </div>
        <p className="text-sm text-bpim-muted">
          {t("settings.apiKey.desc")}
        </p>
      </div>

      <div className="flex w-full flex-col gap-2 md:w-auto">
        <div className="flex w-full items-center md:w-[450px]">
          <Input
            value={rawKey || keyInfo?.key || ""}
            placeholder={isLoading ? "Loading..." : t("settings.apiKey.notIssued")}
            readOnly
            className="h-9 flex-1 rounded-r-none border-bpim-border bg-bpim-bg/40 font-mono text-xs focus-visible:ring-0"
          />
          {(rawKey || keyInfo?.exists) && (
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
            ) : keyInfo?.exists ? (
              <RefreshCw className="mr-1 h-3 w-3" />
            ) : (
              t("settings.apiKey.issue")
            )}
            {keyInfo?.exists && t("settings.apiKey.reissue")}
          </Button>
        </div>
        {rawKey && (
          <p className="text-[10px] font-bold text-bpim-warning">
            {t("settings.apiKey.warning")}
          </p>
        )}
      </div>

      <ActionConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeGenerate}
        isLoading={isLoading}
        title={t("settings.apiKey.dialogTitle")}
        description={t("settings.apiKey.dialogDesc")}
        confirmLabel={t("common.reissue")}
        isDestructive
      />
    </div>
  );
}
