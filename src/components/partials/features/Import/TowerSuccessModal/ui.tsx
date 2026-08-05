"use client";

import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { LordiconAnimation } from "@/components/ui/lordicon-animation";
import { type TowerImportResult } from "@/hooks/import/useIidxTowerImport";
import { useTranslation } from "@/hooks/common/useTranslation";
import ResultModalShell from "../ResultModalShell";

interface Props {
  result: TowerImportResult | null;
  onClose: () => void;
}

const TowerImportSuccessModal = ({ result, onClose }: Props) => {
  const router = useRouter();
  const { t } = useTranslation();

  if (!result) return null;

  return (
    <ResultModalShell
      showFireworks
      icon={<LordiconAnimation src="/lottie/trending-up.json" trigger="loop" />}
      title={t("import.towerSuccess.title")}
      subtitle={`${result.upsertedCount} ${t("import.towerSuccess.updated")}`}
      actions={
        <>
          <Button
            size="lg"
            className="w-full bg-bpim-primary font-black text-bpim-text hover:bg-bpim-primary active:scale-95 transition-all"
            onClick={() => router.push("/")}
          >
            {t("import.towerSuccess.backToDashboard")}
          </Button>

          <Button
            variant="ghost"
            className="text-bpim-muted hover:text-bpim-text"
            onClick={onClose}
          >
            {t("common.close")}
          </Button>
        </>
      }
    >
      <div className="flex w-full flex-col gap-4 py-2 border-t border-b border-bpim-border/50 my-2">
        <span className="text-[10px] font-black tracking-[0.2em] text-bpim-muted uppercase">
          {t("import.towerSuccess.notesImported")}
        </span>

        <div className="flex items-center justify-center gap-8">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-bpim-subtle">
              {t("import.towerSuccess.keys")}
            </span>
            <span className="font-mono text-3xl font-black text-bpim-text tabular-nums leading-none">
              +{result.addedKeyCount.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-bpim-subtle">
              {t("import.towerSuccess.scratch")}
            </span>
            <span className="font-mono text-3xl font-black text-bpim-text tabular-nums leading-none">
              +{result.addedScratchCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </ResultModalShell>
  );
};

export default TowerImportSuccessModal;
