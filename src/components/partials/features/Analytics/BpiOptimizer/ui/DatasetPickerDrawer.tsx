import { useEffect, useState } from "react";
import { ArrowLeft, Check, History } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { versionTitles } from "@/constants/iidx/versionTitles";
import { BPM_BANDS, type BpmBand } from "@/constants/iidx/bpm";
import { ALL_RADAR_CATEGORIES } from "@/constants/iidx/radars";
import type { IIDXVersion } from "@/types/iidx/version";
import type { RadarCategory } from "@/types/stats/radar";
import { useTranslation } from "@/hooks/common/useTranslation";
import { RADAR_LABELS } from "./shared";

export type DatasetSource = IIDXVersion | "self-best";
export interface DatasetFilters {
  bpmBands: BpmBand[];
  radarCategories: RadarCategory[];
}

const EMPTY_FILTERS: DatasetFilters = { bpmBands: [], radarCategories: [] };
const REVERSED_VERSIONS = [...versionTitles].reverse();

const FilterCheckbox = ({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) => (
  <label
    className={cn(
      "flex items-center gap-2 rounded-lg border px-2.5 py-2 cursor-pointer transition-colors",
      checked
        ? "border-bpim-primary/40 bg-bpim-primary/5"
        : "border-bpim-border bg-bpim-bg hover:bg-bpim-overlay",
    )}
  >
    <Checkbox
      checked={checked}
      onCheckedChange={onToggle}
      className="sr-only"
    />
    <span
      className={cn(
        "text-xs font-bold",
        checked ? "text-bpim-text" : "text-bpim-subtle",
      )}
    >
      {label}
    </span>
  </label>
);

const DatasetPickerDrawer = ({
  open,
  onOpenChange,
  value = null,
  onPick,
  withFilterStep = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 現在選択中の値。選択済みの状態を持たない一回限りの選択には`null`（未指定可）を渡す */
  value?: DatasetSource | null;
  onPick: (source: DatasetSource, filters: DatasetFilters) => void;
  /** trueの場合、データセット選択後に「対象曲をフィルタ」ステップを挟む */
  withFilterStep?: boolean;
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<"source" | "filter">("source");
  const [pendingSource, setPendingSource] = useState<DatasetSource | null>(
    null,
  );
  const [bpmBands, setBpmBands] = useState<BpmBand[]>([]);
  const [radarCategories, setRadarCategories] = useState<RadarCategory[]>([]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep("source");
    setPendingSource(null);
    setBpmBands([]);
    setRadarCategories([]);
  }, [open]);

  const handleSelectSource = (source: DatasetSource) => {
    if (!withFilterStep) {
      onPick(source, EMPTY_FILTERS);
      onOpenChange(false);
      return;
    }
    setPendingSource(source);
    setStep("filter");
  };

  const toggleBpmBand = (band: BpmBand) =>
    setBpmBands((prev) =>
      prev.includes(band) ? prev.filter((b) => b !== band) : [...prev, band],
    );
  const toggleRadarCategory = (cat: RadarCategory) =>
    setRadarCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );

  const handleConfirmFilter = () => {
    if (!pendingSource) return;
    onPick(pendingSource, { bpmBands, radarCategories });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {/* 「新規作成」Drawerの上に重ねて開くため、背後の新規作成Drawer本体(z-1002)より
          オーバーレイ・本体ともに手前に出るようz-indexを底上げする */}
      <DrawerContent className="z-1012" overlayClassName="z-1010">
        {step === "source" ? (
          <>
            <DrawerHeader>
              <DrawerTitle>{t("optimizer.datasetLabel")}</DrawerTitle>
            </DrawerHeader>

            <div className="flex min-h-0 flex-col gap-1 overflow-y-auto px-4 pb-8">
              <button
                type="button"
                onClick={() => handleSelectSource("self-best")}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  value === "self-best"
                    ? "border-bpim-primary/40 bg-bpim-primary/5"
                    : "border-bpim-border bg-bpim-bg hover:bg-bpim-overlay",
                )}
              >
                <History
                  className={cn(
                    "h-4 w-4 shrink-0",
                    value === "self-best"
                      ? "text-bpim-primary"
                      : "text-bpim-subtle",
                  )}
                />
                <span className="flex-1 text-sm font-bold text-bpim-text">
                  {t("optimizer.datasetSelfBestLabel")}
                </span>
                {value === "self-best" && (
                  <Check className="h-4 w-4 shrink-0 text-bpim-primary" />
                )}
              </button>

              <div className="my-2 h-px bg-bpim-border" />

              {REVERSED_VERSIONS.map((v) => (
                <button
                  key={v.num}
                  type="button"
                  onClick={() => handleSelectSource(v.num)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    value === v.num
                      ? "border-bpim-primary/40 bg-bpim-primary/5"
                      : "border-bpim-border bg-bpim-bg hover:bg-bpim-overlay",
                  )}
                >
                  <span className="flex-1 text-sm font-bold text-bpim-text">
                    {v.title}
                  </span>
                  {value === v.num && (
                    <Check className="h-4 w-4 shrink-0 text-bpim-primary" />
                  )}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <DrawerHeader className="flex-row items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setStep("source")}
                aria-label={t("optimizer.customGoal.backToSelect")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DrawerTitle>{t("optimizer.datasetFilterLabel")}</DrawerTitle>
            </DrawerHeader>

            <div className="flex min-h-0 flex-col gap-5 overflow-y-auto px-4 pb-4">
              <p className="text-xs leading-relaxed text-bpim-subtle">
                {t("optimizer.datasetFilterHint")}
              </p>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-bpim-muted">
                  {t("optimizer.datasetFilterBpmLabel")}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {BPM_BANDS.map((band) => (
                    <FilterCheckbox
                      key={band}
                      label={t(`optimizer.customGoal.bpmBand.${band}`)}
                      checked={bpmBands.includes(band)}
                      onToggle={() => toggleBpmBand(band)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-bpim-muted">
                  {t("optimizer.datasetFilterRadarLabel")}
                </span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ALL_RADAR_CATEGORIES.map((cat) => (
                    <FilterCheckbox
                      key={cat}
                      label={RADAR_LABELS[cat]}
                      checked={radarCategories.includes(cat)}
                      onToggle={() => toggleRadarCategory(cat)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DrawerFooter className="border-t border-bpim-border pt-4">
              <Button onClick={handleConfirmFilter} className="w-full">
                {t("optimizer.datasetFilterApply")}
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default DatasetPickerDrawer;
