"use client";

import { useRouter } from "next/router";
import Fireworks from "react-canvas-confetti/dist/presets/fireworks";
import { Button } from "@/components/ui/button";
import { LordiconAnimation } from "@/components/ui/lordicon-animation";
import { type TowerImportResult } from "@/hooks/import/useIidxTowerImport";

interface Props {
  result: TowerImportResult | null;
  onClose: () => void;
}

export const TowerImportSuccessModal = ({ result, onClose }: Props) => {
  const router = useRouter();

  if (!result) return null;

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-bpim-bg/80 backdrop-blur-sm p-4">
      <Fireworks
        autorun={{ speed: 2, duration: 1500 }}
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 1001,
          pointerEvents: "none",
        }}
      />

      <div className="relative z-1002 flex w-full max-w-100 flex-col items-center gap-7 rounded-2xl border border-bpim-border bg-bpim-surface-2 p-8 text-center shadow-2xl">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bpim-primary/10 text-bpim-primary">
          <LordiconAnimation src="/lottie/trending-up.json" trigger="loop" />
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-black tracking-tight text-bpim-text uppercase">
            Tower Import Completed
          </h2>
          <p className="text-sm font-medium text-bpim-muted">
            {result.upsertedCount} 件のタワーデータを更新しました
          </p>
        </div>

        <div className="flex w-full flex-col gap-4 py-2 border-t border-b border-bpim-border/50 my-2">
          <span className="text-[10px] font-black tracking-[0.2em] text-bpim-muted uppercase">
            取り込まれたノーツ数
          </span>

          <div className="flex items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-bpim-subtle">鍵盤</span>
              <span className="font-mono text-3xl font-black text-bpim-text tabular-nums leading-none">
                +{result.addedKeyCount.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-bpim-subtle">
                スクラッチ
              </span>
              <span className="font-mono text-3xl font-black text-bpim-text tabular-nums leading-none">
                +{result.addedScratchCount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Button
            size="lg"
            className="w-full bg-bpim-primary font-black text-bpim-text hover:bg-bpim-primary active:scale-95 transition-all"
            onClick={() => router.push("/")}
          >
            ダッシュボードへ戻る
          </Button>

          <Button
            variant="ghost"
            className="text-bpim-muted hover:text-bpim-text"
            onClick={onClose}
          >
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
};
