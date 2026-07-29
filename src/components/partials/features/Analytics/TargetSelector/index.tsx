"use client";

import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { AnalyticsTarget } from "@/types/analytics";
import { useTargetSelector } from "../../../../hooks/analytics/useTargetSelector";
import {
  KindStep,
  RivalPickStep,
  ArenaRankStep,
  SelfVersionPickStep,
} from "./ui";

interface TargetSelectorModalProps {
  isOpen: boolean;
  current: AnalyticsTarget | null;
  onSelect: (target: AnalyticsTarget) => void;
  onClose: () => void;
}

export const TargetSelectorModal = ({
  isOpen,
  current,
  onSelect,
  onClose,
}: TargetSelectorModalProps) => {
  const { t } = useTranslation();
  const {
    step,
    setStep,
    selectedKind,
    selectedArenaRank,
    setSelectedArenaRank,
    selectedSelfVersion,
    kindOptions,
    stepTitle,
    handleKindClick,
    handleRivalPick,
    handleArenaConfirm,
    handleSelfVersionPick,
  } = useTargetSelector({ isOpen, current, onSelect, onClose });

  const BackButton = () => (
    <button
      onClick={() => setStep("kind")}
      className="self-start text-xs text-bpim-muted hover:text-bpim-text flex items-center gap-1"
    >
      {t("common.back")}
    </button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        placement="bottom-sheet"
        disableScrollWrapper
        className="flex flex-col p-0 overflow-hidden"
      >
        <DialogHeader className="border-b p-4 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="flex items-center gap-2 text-bpim-text">
            {stepTitle[step]}
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-col overflow-y-auto p-2 custom-scrollbar">
          <div className="mt-2 flex flex-col gap-3">
            {step === "kind" && (
              <KindStep
                kindOptions={kindOptions}
                selectedKind={selectedKind}
                onKindClick={handleKindClick}
              />
            )}

            {step === "rival-pick" && (
              <>
                <BackButton />
                <RivalPickStep onSelect={handleRivalPick} />
              </>
            )}

            {step === "arena-rank" && (
              <>
                <BackButton />
                <ArenaRankStep
                  selected={selectedArenaRank}
                  onSelect={setSelectedArenaRank}
                />
                <div className="flex gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <AlertCircle className="h-5 w-5 shrink-0 text-yellow-500/80" />
                  <p className="text-[11px] leading-relaxed text-bpim-muted">
                    <strong className="block mb-0.5 text-yellow-500/90 font-bold">
                      {t("common.note")}
                    </strong>
                    {t("analytics.arenaWarning")}
                  </p>
                </div>
                <Button
                  onClick={handleArenaConfirm}
                  className="mt-2 w-full bg-bpim-primary font-bold text-white hover:bg-bpim-primary/80"
                >
                  {t("analytics.compareWithSetting")}
                </Button>
              </>
            )}

            {step === "self-version-pick" && (
              <>
                <BackButton />
                <p className="text-xs text-bpim-muted">
                  {t("analytics.selfVersionNote")}
                </p>
                <SelfVersionPickStep
                  selected={selectedSelfVersion}
                  onSelect={handleSelfVersionPick}
                />
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
