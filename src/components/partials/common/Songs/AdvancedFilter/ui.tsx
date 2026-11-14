"use client";

import { useState } from "react";
import { FilterParamsFrontend } from "@/types/songs/score";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { useTranslation } from "@/hooks/common/useTranslation";
import BpmSection from "./BpmSection";
import ClearStateSection from "./ClearStateSection";
import DateSection from "./DateSection";
import VersionSection from "./VersionSection";
import RadarSection from "./RadarSection";
import ScoreFilterSection from "./ScoreFilterSection";
import MissCountSection from "./MissCountSection";
import PlayStateSection from "./PlayStateSection";

const EMPTY_PARAMS: FilterParamsFrontend = {
  bpmMin: undefined,
  bpmMax: undefined,
  isSofran: undefined,
  excludeSofran: undefined,
  since: undefined,
  until: undefined,
  versions: [],
  clearStates: [],
  scoreFilters: [],
  missCountMin: undefined,
  missCountMax: undefined,
  radarCategories: [],
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  params: FilterParamsFrontend;
  onParamsChange: (params: Partial<FilterParamsFrontend>) => void;
  /** 「プレイ状態」（プレイ済み/未プレイ/すべて）の選択を出す。スコア一覧用 */
  withPlayState?: boolean;
}

interface AdvancedFilterModalBodyProps {
  initialParams: FilterParamsFrontend;
  onApply: (params: FilterParamsFrontend) => void;
  withPlayState: boolean;
}

const AdvancedFilterModalBody = ({
  initialParams,
  onApply,
  withPlayState,
}: AdvancedFilterModalBodyProps) => {
  const { t } = useTranslation();
  const [localParams, setLocalParams] =
    useState<FilterParamsFrontend>(initialParams);

  const updateLocal = (val: Partial<FilterParamsFrontend>) => {
    setLocalParams((prev) => ({ ...prev, ...val }));
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-base font-bold">
          {t("filter.advancedFilter")}
        </DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-6 py-4 overflow-y-auto max-h-[70vh] pr-2 scrollbar-thin">
        {withPlayState && (
          <>
            <PlayStateSection
              isMyPlayed={localParams.isMyPlayed}
              onChange={updateLocal}
            />
            <Separator className="bg-bpim-surface-2/60" />
          </>
        )}
        <BpmSection
          bpmMin={localParams.bpmMin}
          bpmMax={localParams.bpmMax}
          isSofran={localParams.isSofran}
          excludeSofran={localParams.excludeSofran}
          withExcludeSofran
          onChange={updateLocal}
        />
        <Separator className="bg-bpim-surface-2/60" />
        <ClearStateSection
          clearStates={localParams.clearStates}
          onChange={updateLocal}
        />
        <Separator className="bg-bpim-surface-2/60" />
        <DateSection
          since={localParams.since}
          until={localParams.until}
          onChange={updateLocal}
        />
        <Separator className="bg-bpim-surface-2/60" />
        <VersionSection versions={localParams.versions} onChange={updateLocal} />
        <Separator className="bg-bpim-surface-2/60" />
        <RadarSection
          radarCategories={localParams.radarCategories}
          onChange={updateLocal}
        />
        <Separator className="bg-bpim-surface-2/60" />
        <ScoreFilterSection
          scoreFilters={localParams.scoreFilters}
          onChange={updateLocal}
        />
        <Separator className="bg-bpim-surface-2/60" />
        <MissCountSection
          missCountMin={localParams.missCountMin}
          missCountMax={localParams.missCountMax}
          onChange={updateLocal}
        />
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setLocalParams(
              withPlayState ? { ...EMPTY_PARAMS, isMyPlayed: undefined } : EMPTY_PARAMS,
            )
          }
          className="text-bpim-muted"
        >
          {t("filter.reset")}
        </Button>
        <Button
          className="bg-bpim-primary font-bold hover:bg-bpim-primary"
          size="sm"
          onClick={() => onApply(localParams)}
        >
          {t("filter.apply")}
        </Button>
      </DialogFooter>
    </>
  );
};

const AdvancedFilterModal = ({
  isOpen,
  onClose,
  params,
  onParamsChange,
  withPlayState = false,
}: Props) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl border-bpim-border p-6 text-bpim-text">
        <AdvancedFilterModalBody
          key={isOpen ? JSON.stringify(params) : "closed"}
          initialParams={params}
          withPlayState={withPlayState}
          onApply={(next) => {
            onParamsChange(next);
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedFilterModal;
