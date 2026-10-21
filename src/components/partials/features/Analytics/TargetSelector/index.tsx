"use client";

import { AlertCircle, ChevronLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { AnalyticsTarget } from "@/types/analytics";
import { useTargetSelector } from "@/hooks/analytics/useTargetSelector";
import {
  KindStep,
  ArenaRankStep,
  SelfVersionPickStep,
  TopRankerAreaStep,
  VersionPickStep,
} from "./ui";
import RivalPickStep from "./RivalPickStep";
import { useScoredVersions } from "@/hooks/scores/useScoredVersions";
import { ARENA_DATA_VERSIONS } from "@/hooks/analytics/useTargetSelector";
import { TOP_RANKER_VERSIONS } from "@/constants/iidx/topRankerAreas";
import { versionTitles } from "@/constants/iidx/versionTitles";

interface TargetSelectorModalProps {
  isOpen: boolean;
  current: AnalyticsTarget | null;
  onSelect: (target: AnalyticsTarget) => void;
  onClose: () => void;
}

const TargetSelectorModal = ({
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
    selectedSelfVersion,
    selectedTopRankerArea,
    kindOptions,
    stepTitle,
    backStep,
    pendingKind,
    handleVersionPick,
    handleKindClick,
    handleRivalPick,
    handleArenaRankPick,
    pendingParam,
    handleSelfVersionPick,
    handleTopRankerAreaPick,
  } = useTargetSelector({ isOpen, current, onSelect, onClose });
  const { versions: rivalVersions } = useScoredVersions(
    pendingKind === "rival" ? pendingParam : undefined,
  );

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        placement="bottom-sheet"
        disableScrollWrapper
        className="flex flex-col p-0 overflow-hidden"
      >
        <DialogHeader className="border-b p-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex min-w-0 items-center gap-2">
            {backStep[step] && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-bpim-muted hover:text-bpim-text"
                aria-label={t("common.back")}
                onClick={() => setStep(backStep[step]!)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="flex items-center gap-2 text-bpim-text">
              {stepTitle[step]}
            </DialogTitle>
          </div>
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
              <RivalPickStep onSelect={handleRivalPick} />
            )}

            {step === "arena-rank" && (
              <>
                <ArenaRankStep
                  selected={selectedArenaRank}
                  onSelect={handleArenaRankPick}
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
                <p className="text-xs text-bpim-muted">
                  {t("analytics.selfVersionNote")}
                </p>
                <SelfVersionPickStep
                  selected={selectedSelfVersion}
                  onSelect={handleSelfVersionPick}
                />
              </>
            )}

            {step === "version-pick" && (
              <VersionPickStep
                versions={[...versionTitles]
                  .sort(
                    (a, b) =>
                      (b.num === "INF" ? -1 : Number(b.num)) -
                      (a.num === "INF" ? -1 : Number(a.num)),
                  )}
                availableVersions={
                  pendingKind === "rival"
                    ? rivalVersions
                    : pendingKind === "arena"
                      ? ARENA_DATA_VERSIONS
                      : pendingKind === "top-ranker"
                        ? [...TOP_RANKER_VERSIONS]
                        : undefined
                }
                onSelect={handleVersionPick}
              />
            )}

            {step === "top-ranker-area" && (
              <>
                <TopRankerAreaStep
                  selected={selectedTopRankerArea}
                  onSelect={handleTopRankerAreaPick}
                />
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TargetSelectorModal;
