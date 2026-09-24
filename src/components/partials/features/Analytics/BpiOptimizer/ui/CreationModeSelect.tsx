import {
  Sparkles,
  ListChecks,
  History,
  Download,
  Target,
  CircleDashed,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { TranslationKey } from "@/lib/i18n/translations";

const MODE_CARDS: {
  key: "auto" | "custom" | "selfBestSet" | "import" | "singleBpiTarget";
  icon: LucideIcon;
  titleKey: TranslationKey;
  descKey: TranslationKey;
}[] = [
  {
    key: "auto",
    icon: Sparkles,
    titleKey: "optimizer.mode.autoCard.title",
    descKey: "optimizer.mode.autoCard.desc",
  },
  {
    key: "custom",
    icon: ListChecks,
    titleKey: "optimizer.mode.customCard.title",
    descKey: "optimizer.mode.customCard.desc",
  },
  {
    key: "selfBestSet",
    icon: History,
    titleKey: "optimizer.mode.selfBestSetCard.title",
    descKey: "optimizer.mode.selfBestSetCard.desc",
  },
  {
    key: "singleBpiTarget",
    icon: Target,
    titleKey: "optimizer.mode.singleBpiTargetCard.title",
    descKey: "optimizer.mode.singleBpiTargetCard.desc",
  },
  {
    key: "import",
    icon: Download,
    titleKey: "optimizer.mode.importCard.title",
    descKey: "optimizer.mode.importCard.desc",
  },
];

const CreationModeSelect = ({
  onSelect,
  onImportClick,
  onSelfBestSetClick,
  isSelfBestSetLoading,
  onSingleBpiTargetClick,
}: {
  onSelect: (mode: "auto" | "custom") => void;
  onImportClick: () => void;
  onSelfBestSetClick: () => void;
  isSelfBestSetLoading?: boolean;
  onSingleBpiTargetClick: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {MODE_CARDS.map((card) => {
        const isLoading = card.key === "selfBestSet" && isSelfBestSetLoading;
        return (
          <button
            key={card.key}
            disabled={isLoading}
            onClick={() => {
              if (card.key === "import") return onImportClick();
              if (card.key === "selfBestSet") return onSelfBestSetClick();
              if (card.key === "singleBpiTarget")
                return onSingleBpiTargetClick();
              return onSelect(card.key);
            }}
            className="group flex flex-col items-start gap-2 rounded-xl border border-bpim-border bg-bpim-surface p-4 text-left transition-all hover:border-bpim-primary/50 hover:ring-2 hover:ring-bpim-primary/20 disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bpim-primary/10 text-bpim-primary transition-transform group-hover:scale-110">
                {isLoading ? (
                  <CircleDashed className="h-4 w-4 animate-spin" />
                ) : (
                  <card.icon className="h-4 w-4" />
                )}
              </div>
              <span className="text-sm font-bold text-bpim-text">
                {t(card.titleKey)}
              </span>
            </div>
            <span className="text-xs leading-relaxed text-bpim-muted">
              {t(card.descKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CreationModeSelect;
