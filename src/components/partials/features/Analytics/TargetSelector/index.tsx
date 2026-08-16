"use client";

import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { AnalyticsTarget } from "@/types/analytics";
import { useTargetSelector } from "@/hooks/analytics/useTargetSelector";
import { MAX_COMPARISON_TARGETS } from "@/constants/logic/analyticsComparison";
import {
  KindStep,
  RivalPickStep,
  ArenaRankStep,
  SelfVersionPickStep,
} from "./ui";

const BackButton = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={onBack}
      className="self-start text-xs text-bpim-muted hover:text-bpim-text flex items-center gap-1"
    >
      {t("common.back")}
    </button>
  );
};

interface TargetSelectorModalProps {
  isOpen: boolean;
  /** 現在選択中のターゲット一覧（複数選択、#287） */
  current: AnalyticsTarget[];
  onChange: (targets: AnalyticsTarget[]) => void;
  onClose: () => void;
}

const TargetSelectorModal = ({
  isOpen,
  current,
  onChange,
  onClose,
}: TargetSelectorModalProps) => {
  const { t, tFormat } = useTranslation();
  const {
    step,
    setStep,
    kindOptions,
    stepTitle,
    isSelected,
    countForKind,
    isCapReached,
    handleKindClick,
    handleKindToggle,
    handleRivalToggle,
    handleRivalSelectOnly,
    handleArenaToggle,
    handleArenaSelectOnly,
    handleSelfVersionToggle,
    handleSelfVersionSelectOnly,
  } = useTargetSelector({ isOpen, current, onChange, onClose });

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
          <Badge variant={isCapReached ? "destructive" : "secondary"}>
            {tFormat("analytics.selectedCount", {
              count: current.length + 1,
              max: MAX_COMPARISON_TARGETS,
            })}
          </Badge>
        </DialogHeader>

        <div className="flex min-h-0 flex-col overflow-y-auto p-2 custom-scrollbar">
          <div className="mt-2 flex flex-col gap-3">
            {step === "kind" && (
              <KindStep
                kindOptions={kindOptions}
                isSelected={(opt) => isSelected({ kind: opt.kind, label: opt.label })}
                countForKind={countForKind}
                isCapReached={isCapReached}
                onKindClick={handleKindClick}
                onKindToggle={handleKindToggle}
              />
            )}

            {step === "rival-pick" && (
              <>
                <BackButton onBack={() => setStep("kind")} />
                <RivalPickStep
                  isSelected={(userId) =>
                    isSelected({ kind: "rival", param: userId, label: "" })
                  }
                  isCapReached={isCapReached}
                  onToggle={handleRivalToggle}
                  onSelectOnly={handleRivalSelectOnly}
                />
              </>
            )}

            {step === "arena-rank" && (
              <>
                <BackButton onBack={() => setStep("kind")} />
                <ArenaRankStep
                  isSelected={(rankId) =>
                    isSelected({ kind: "arena", param: rankId, label: "" })
                  }
                  isCapReached={isCapReached}
                  onToggle={handleArenaToggle}
                  onSelectOnly={handleArenaSelectOnly}
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
              </>
            )}

            {step === "self-version-pick" && (
              <>
                <BackButton onBack={() => setStep("kind")} />
                <p className="text-xs text-bpim-muted">
                  {t("analytics.selfVersionNote")}
                </p>
                <SelfVersionPickStep
                  isSelected={(versionNum) =>
                    isSelected({
                      kind: "self-version",
                      param: versionNum,
                      label: "",
                    })
                  }
                  isCapReached={isCapReached}
                  onToggle={handleSelfVersionToggle}
                  onSelectOnly={handleSelfVersionSelectOnly}
                />
              </>
            )}
          </div>
        </div>

        <div className="border-t p-4">
          <Button
            onClick={onClose}
            className="w-full bg-bpim-primary font-bold text-white hover:bg-bpim-primary/80"
          >
            {t("common.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TargetSelectorModal;
