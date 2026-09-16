"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ALL_RADAR_CATEGORIES, RADAR_COLORS } from "@/constants/iidx/radars";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { RadarFilterKey, RadarFilterRange } from "@/types/users/list";

const RADAR_KEY_BY_CATEGORY: Record<string, RadarFilterKey> = {
  NOTES: "notes",
  CHORD: "chord",
  PEAK: "peak",
  CHARGE: "charge",
  SCRATCH: "scratch",
  SOFLAN: "soflan",
};

export type RangeFilters = Partial<Record<RadarFilterKey, RadarFilterRange>>;

const EMPTY_FILTERS: RangeFilters = {};

interface RangeRowProps {
  label: string;
  color?: string;
  range: RadarFilterRange | undefined;
  onChange: (range: RadarFilterRange) => void;
}

const RangeRow = ({ label, color, range, onChange }: RangeRowProps) => (
  <div className="flex items-center gap-3">
    <Label className="w-20 shrink-0 text-xs font-bold" style={color ? { color } : undefined}>
      {label}
    </Label>
    <Input
      placeholder="Min"
      type="number"
      className="h-9 border-bpim-border bg-bpim-surface-2/60"
      value={range?.min ?? ""}
      onChange={(e) =>
        onChange({
          ...range,
          min: e.target.value ? Number(e.target.value) : undefined,
        })
      }
    />
    <span className="text-bpim-subtle">~</span>
    <Input
      placeholder="Max"
      type="number"
      className="h-9 border-bpim-border bg-bpim-surface-2/60"
      value={range?.max ?? ""}
      onChange={(e) =>
        onChange({
          ...range,
          max: e.target.value ? Number(e.target.value) : undefined,
        })
      }
    />
  </div>
);

interface RangeFilterModalBodyProps {
  initialFilters: RangeFilters;
  onApply: (filters: RangeFilters) => void;
}

const RangeFilterModalBody = ({ initialFilters, onApply }: RangeFilterModalBodyProps) => {
  const { t } = useTranslation();
  const [local, setLocal] = useState<RangeFilters>(initialFilters);

  const setRange = (key: RadarFilterKey, range: RadarFilterRange) => {
    setLocal((prev) => ({ ...prev, [key]: range }));
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-base font-bold">
          {t("rivals.rangeFilter.title")}
        </DialogTitle>
      </DialogHeader>

      <p className="text-xs text-bpim-muted">{t("rivals.rangeFilter.desc")}</p>

      <div className="flex flex-col gap-3 py-2">
        <RangeRow
          label={t("rivals.rangeFilter.totalBpi")}
          range={local.totalBpi}
          onChange={(range) => setRange("totalBpi", range)}
        />
        <Separator className="bg-bpim-surface-2/60" />
        {ALL_RADAR_CATEGORIES.map((cat) => {
          const key = RADAR_KEY_BY_CATEGORY[cat];
          return (
            <RangeRow
              key={cat}
              label={cat}
              color={RADAR_COLORS[cat]}
              range={local[key]}
              onChange={(range) => setRange(key, range)}
            />
          );
        })}
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocal(EMPTY_FILTERS)}
          className="text-bpim-muted"
        >
          {t("filter.reset")}
        </Button>
        <Button
          className="bg-bpim-primary font-bold hover:bg-bpim-primary"
          size="sm"
          onClick={() => onApply(local)}
        >
          {t("filter.apply")}
        </Button>
      </DialogFooter>
    </>
  );
};

interface RangeFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: RangeFilters;
  onFiltersChange: (filters: RangeFilters) => void;
}

const RangeFilterModal = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: RangeFilterModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-bpim-border p-6 text-bpim-text">
        <RangeFilterModalBody
          key={isOpen ? JSON.stringify(filters) : "closed"}
          initialFilters={filters}
          onApply={(next) => {
            onFiltersChange(next);
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default RangeFilterModal;
