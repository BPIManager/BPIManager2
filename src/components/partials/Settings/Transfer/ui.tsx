"use client";

import { useState } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { useFirestoreDataCheck } from "@/hooks/firestore/checkData";
import { versionTitles } from "@/constants/iidx/versionTitles";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { ActionConfirmDialog } from "../../Modal/Confirmation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Database, RefreshCw } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function TransferUi() {
  const { fbUser } = useUser();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { checkData, foundVersions, isChecking } = useFirestoreDataCheck(
    fbUser?.uid,
  );
  const { t } = useTranslation();

  const handleOpenConfirm = async () => {
    setIsConfirmOpen(true);
    await checkData();
  };

  const handleSyncFirestore = async () => {
    if (!fbUser?.uid) return;
    setIsSyncing(true);
    try {
      const idToken = await fbUser.getIdToken(true);
      const response = await fetch(
        `${API_PREFIX}/users/${fbUser.uid}/scores/transfer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        },
      );
      if (!response.ok) throw new Error("transfer failed");
      toast.success(t("settings.transfer.success"));
      setIsConfirmOpen(false);
    } catch (e) {
      toast.error(t("settings.transfer.error"));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-6 rounded-xl border border-bpim-border bg-bpim-bg p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-bpim-primary">
          <Database className="h-4 w-4" />
          <span className="font-bold">{t("settings.transfer.title")}</span>
        </div>
        <p className="text-sm text-bpim-muted">
          {t("settings.transfer.desc")}
        </p>
        <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-bpim-warning leading-relaxed">
          <span>{t("settings.transfer.warning1")}</span>
          <span>{t("settings.transfer.warning2")}</span>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={handleOpenConfirm}
        disabled={isSyncing}
        className="w-full md:w-auto min-w-[100px] gap-2"
      >
        {isSyncing ? <LoadingSpinner size="sm" /> : <RefreshCw />}
        {isSyncing ? t("settings.transfer.syncing") : t("settings.transfer.sync")}
      </Button>

      <ActionConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSyncFirestore}
        title={t("settings.transfer.dialogTitle")}
        isDestructive
        isLoading={isSyncing}
        description={
          <div className="flex flex-col gap-4 text-left">
            <p className="text-sm text-bpim-text">
              {t("settings.transfer.dialogDesc")}
            </p>

            <div className="rounded-md border border-bpim-border bg-bpim-surface-2/60 p-3">
              <span className="mb-2 block text-xs font-bold text-bpim-muted">
                {t("settings.transfer.migratableData")}
              </span>
              {isChecking ? (
                <div className="flex items-center gap-2 text-xs text-bpim-text">
                  <LoadingSpinner size="xs" />
                  <span>{t("common.scanning")}</span>
                </div>
              ) : foundVersions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {foundVersions.map((v) => (
                    <Badge
                      key={v}
                      variant="secondary"
                      className="bg-bpim-primary/10 text-bpim-primary hover:bg-bpim-primary/20"
                    >
                      {versionTitles.find((item) => item.num === String(v))
                        ?.title || `Ver.${v}`}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-bpim-danger font-bold">
                  {t("settings.transfer.noData")}
                </p>
              )}
            </div>

            <p className="text-[11px] text-bpim-warning font-bold leading-tight">
              {t("settings.transfer.overwriteWarning")}
            </p>
            <p className="text-[11px] text-bpim-danger leading-tight">
              {t("settings.transfer.timeWarning")}
            </p>
          </div>
        }
        confirmLabel={foundVersions.length > 0 ? t("settings.transfer.sync") : t("settings.transfer.cannotProceed")}
      />
    </div>
  );
}
