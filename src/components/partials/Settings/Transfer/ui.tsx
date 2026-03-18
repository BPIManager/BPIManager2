"use client";

import { useState } from "react";
import { LuRefreshCw, LuDatabase, LuLoader } from "react-icons/lu";
import { useUser } from "@/contexts/users/UserContext";
import { useFirestoreDataCheck } from "@/hooks/firestore/checkData";
import { versionTitles } from "@/constants/versions";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { ActionConfirmDialog } from "../../Modal/Confirmation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function TransferUi() {
  const { fbUser } = useUser();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { checkData, foundVersions, isChecking } = useFirestoreDataCheck(
    fbUser?.uid,
  );

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
      if (!response.ok) throw new Error("転送失敗");
      toast.success("データの移行が完了しました。");
      setIsConfirmOpen(false);
    } catch (e) {
      toast.error("エラーが発生したため処理が完了しませんでした");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-6 rounded-xl border border-bpim-border bg-bpim-bg p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-blue-400">
          <LuDatabase className="h-4 w-4" />
          <span className="font-bold">データ移行</span>
        </div>
        <p className="text-sm text-slate-400">
          BPIManagerで保存されたスコアをBPIM2へ引き継ぎます。
        </p>
        <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-orange-300 leading-relaxed">
          <span>
            ※
            BPIM2で登録されたデータをすべて削除し、BPIManagerのスコアに置き換えます。
          </span>
          <span>※ 操作を取り消すことはできません。</span>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={handleOpenConfirm}
        disabled={isSyncing}
        className="w-full md:w-auto min-w-[100px] gap-2"
      >
        {isSyncing ? <LuLoader className="animate-spin" /> : <LuRefreshCw />}
        {isSyncing ? "同期中..." : "同期"}
      </Button>

      <ActionConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSyncFirestore}
        title="データの同期と置き換え"
        isDestructive
        isLoading={isSyncing}
        description={
          <div className="flex flex-col gap-4 text-left">
            <p className="text-sm text-slate-300">
              BPIManagerで保存されたデータをBPIM2へ移行します。
            </p>

            <div className="rounded-md border border-bpim-border bg-white/5 p-3">
              <span className="mb-2 block text-xs font-bold text-slate-400">
                移行可能なデータ:
              </span>
              {isChecking ? (
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <LuLoader className="h-3 w-3 animate-spin" />
                  <span>スキャン中...</span>
                </div>
              ) : foundVersions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {foundVersions.map((v) => (
                    <Badge
                      key={v}
                      variant="secondary"
                      className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                    >
                      {versionTitles.find((item) => item.num === String(v))
                        ?.title || `Ver.${v}`}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-red-400 font-bold">
                  同期可能なデータが見つかりません。
                </p>
              )}
            </div>

            <p className="text-[11px] text-orange-400 font-bold leading-tight">
              ※ 同期を実行すると現在のBPIM2のデータは上書き削除されます。
            </p>
            <p className="text-[11px] text-red-400 leading-tight">
              ※
              処理には最大2~3分かかることがあります。画面を閉じずにお待ちください。
            </p>
          </div>
        }
        confirmLabel={foundVersions.length > 0 ? "同期" : "続行できません"}
      />
    </div>
  );
}
