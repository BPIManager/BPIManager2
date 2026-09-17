import { Sparkles, ListChecks } from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";

const CreationModeSelect = ({
  onSelect,
}: {
  onSelect: (mode: "auto" | "custom") => void;
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <button
        onClick={() => onSelect("auto")}
        className="group flex flex-col items-start gap-3 rounded-xl border border-bpim-border bg-bpim-surface p-5 text-left transition-all hover:border-bpim-primary/50 hover:ring-2 hover:ring-bpim-primary/20"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bpim-primary/10 text-bpim-primary transition-transform group-hover:scale-110">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold text-bpim-text">
            {t("optimizer.mode.autoCard.title")}
          </span>
          <span className="text-xs leading-relaxed text-bpim-muted">
            {t("optimizer.mode.autoCard.desc")}
          </span>
        </div>
      </button>

      <button
        onClick={() => onSelect("custom")}
        className="group flex flex-col items-start gap-3 rounded-xl border border-bpim-border bg-bpim-surface p-5 text-left transition-all hover:border-bpim-primary/50 hover:ring-2 hover:ring-bpim-primary/20"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bpim-primary/10 text-bpim-primary transition-transform group-hover:scale-110">
          <ListChecks className="h-5 w-5" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold text-bpim-text">
            {t("optimizer.mode.customCard.title")}
          </span>
          <span className="text-xs leading-relaxed text-bpim-muted">
            {t("optimizer.mode.customCard.desc")}
          </span>
        </div>
      </button>
    </div>
  );
};

export default CreationModeSelect;
