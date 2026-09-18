import { Check, History } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { versionTitles } from "@/constants/iidx/versionTitles";
import type { IIDXVersion } from "@/types/iidx/version";
import { useTranslation } from "@/hooks/common/useTranslation";

export type DatasetSource = IIDXVersion | "self-best";

const REVERSED_VERSIONS = [...versionTitles].reverse();

const DatasetPickerDrawer = ({
  open,
  onOpenChange,
  value = null,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 現在選択中の値。選択済みの状態を持たない一回限りの選択には`null`（未指定可）を渡す */
  value?: DatasetSource | null;
  onPick: (source: DatasetSource) => void;
}) => {
  const { t } = useTranslation();

  const handlePick = (source: DatasetSource) => {
    onPick(source);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="z-1012" overlayClassName="z-1010">
        <DrawerHeader>
          <DrawerTitle>{t("optimizer.datasetLabel")}</DrawerTitle>
        </DrawerHeader>

        <div className="flex min-h-0 flex-col gap-1 overflow-y-auto px-4 pb-8">
          <button
            type="button"
            onClick={() => handlePick("self-best")}
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
              onClick={() => handlePick(v.num)}
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
      </DrawerContent>
    </Drawer>
  );
};

export default DatasetPickerDrawer;
