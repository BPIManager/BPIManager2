import { Info } from "lucide-react";
import type { ColdCategoryAdvisory } from "@/types/bpi-optimizer";
import { RADAR_LABELS } from "./shared";
import { useTranslation } from "@/hooks/common/useTranslation";

interface ColdCategoryNoticeProps {
  coldCategories: ColdCategoryAdvisory[];
}

const ColdCategoryNotice = ({ coldCategories }: ColdCategoryNoticeProps) => {
  const { t, tFormat } = useTranslation();

  return (
    <div className="rounded-xl border border-bpim-primary/30 bg-bpim-primary/5 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 text-bpim-primary shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold text-bpim-primary">
            {t("optimizer.coldStart.title")}
          </p>
          <p className="text-xs text-bpim-muted leading-snug">
            {t("optimizer.coldStart.description")}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {coldCategories.map((advisory) => (
          <div
            key={advisory.category}
            className="rounded-lg border border-bpim-border bg-bpim-surface p-3 flex flex-col gap-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">
                {RADAR_LABELS[advisory.category]}
              </span>
              <span className="text-xs text-bpim-subtle">
                {tFormat("optimizer.coldStart.playedCount", { count: advisory.playedCount })}
              </span>
            </div>
            {advisory.suggestions.length > 0 && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-bpim-subtle">
                  {t("optimizer.coldStart.suggestionsLabel")}
                </span>
                <ul className="text-xs text-bpim-text list-disc list-inside">
                  {advisory.suggestions.map((s) => (
                    <li key={s.songId}>
                      {s.title} [{s.difficulty}]
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColdCategoryNotice;
