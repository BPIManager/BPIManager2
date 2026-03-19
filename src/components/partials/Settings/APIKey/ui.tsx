"use client";

import { useState } from "react";
import { useApiKey } from "@/hooks/users/useAPIKey";
import { ActionConfirmDialog } from "../../Modal/Confirmation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Key, Copy, Loader, RefreshCw } from "lucide-react";

export default function ApiKeyUi() {
  const { keyInfo, generate, isLoading } = useApiKey();
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const executeGenerate = async () => {
    try {
      const key = await generate();
      setRawKey(key);
      toast.success("APIキーを発行しました。必ず控えてください。", {
        duration: 10000,
      });
      setIsConfirmOpen(false);
    } catch (e) {
      toast.error("発行に失敗しました");
    }
  };

  const handleGenerateClick = () => {
    keyInfo?.exists ? setIsConfirmOpen(true) : executeGenerate();
  };

  const copyToClipboard = () => {
    const text = rawKey || keyInfo?.key;
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success("コピーしました");
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-6 rounded-xl border border-bpim-border bg-bpim-bg p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-bpim-primary">
          <Key className="h-4 w-4" />
          <span className="font-bold">APIキー</span>
        </div>
        <p className="text-sm text-bpim-muted">
          API経由でBPIM2のデータを取得・更新します。
        </p>
      </div>

      <div className="flex w-full flex-col gap-2 md:w-auto">
        <div className="flex w-full items-center md:w-[450px]">
          <Input
            value={rawKey || keyInfo?.key || ""}
            placeholder={isLoading ? "Loading..." : "未発行"}
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
              <Loader className="animate-spin" />
            ) : keyInfo?.exists ? (
              <RefreshCw className="mr-1 h-3 w-3" />
            ) : (
              "発行"
            )}
            {keyInfo?.exists && "再発行"}
          </Button>
        </div>
        {rawKey && (
          <p className="text-[10px] font-bold text-bpim-warning">
            ⚠️ 注意:
            キーは今だけ表示されています。この画面を閉じると二度と表示されません。
          </p>
        )}
      </div>

      <ActionConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeGenerate}
        isLoading={isLoading}
        title="APIキーの再発行"
        description="新しいキーを発行しますか？古いキーは即座に無効化されます。"
        confirmLabel="再発行する"
        isDestructive
      />
    </div>
  );
}
