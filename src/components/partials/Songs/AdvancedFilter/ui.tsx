"use client";

import { useState, useEffect } from "react";
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

import { BpmSection } from "./BpmSection";
import { ClearStateSection } from "./ClearStateSection";
import { DateSection } from "./DateSection";
import { VersionSection } from "./VersionSection";
import { RadarSection } from "./RadarSection";
import { ScoreFilterSection } from "./ScoreFilterSection";
import { MissCountSection } from "./MissCountSection";

const EMPTY_PARAMS: FilterParamsFrontend = {
  bpmMin: undefined,
  bpmMax: undefined,
  isSofran: undefined,
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
}

export const AdvancedFilterModal = ({
  isOpen,
  onClose,
  params,
  onParamsChange,
}: Props) => {
  const [localParams, setLocalParams] = useState<FilterParamsFrontend>(params);

  useEffect(() => {
    if (isOpen) setLocalParams(params);
  }, [isOpen, params]);

  const updateLocal = (val: Partial<FilterParamsFrontend>) => {
    setLocalParams((prev) => ({ ...prev, ...val }));
  };

  const handleApply = () => {
    onParamsChange(localParams);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl border-bpim-border p-6 text-bpim-text">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            詳細フィルター
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4 overflow-y-auto max-h-[70vh] pr-2 scrollbar-thin">
          <BpmSection
            bpmMin={localParams.bpmMin}
            bpmMax={localParams.bpmMax}
            isSofran={localParams.isSofran}
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
          <VersionSection
            versions={localParams.versions}
            onChange={updateLocal}
          />
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
            onClick={() => setLocalParams(EMPTY_PARAMS)}
            className="text-bpim-muted"
          >
            リセット
          </Button>
          <Button
            className="bg-bpim-primary font-bold hover:bg-bpim-primary"
            size="sm"
            onClick={handleApply}
          >
            適用して閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
