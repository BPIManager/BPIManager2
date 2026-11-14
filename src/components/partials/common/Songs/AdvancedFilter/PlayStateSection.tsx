"use client";

import { FilterParamsFrontend } from "@/types/songs/score";
import { cn } from "@/lib/utils";
import SectionTitle from "./SectionTitle";
import { useTranslation } from "@/hooks/common/useTranslation";
import { SCORE_LIST_DEFAULT_PLAY_STATE } from "@/utils/songs/playState";
import type { TranslationKey } from "@/lib/i18n/translations";

interface Props {
  /** true=プレイ済みのみ / false=未プレイのみ / null=すべて / undefined=既定 */
  isMyPlayed: boolean | null | undefined;
  onChange: (val: Partial<FilterParamsFrontend>) => void;
}

const OPTIONS: { value: boolean | null; label: TranslationKey }[] = [
  { value: null, label: "filter.playState.all" },
  { value: true, label: "filter.playState.played" },
  { value: false, label: "filter.playState.unplayed" },
];

const PlayStateSection = ({ isMyPlayed, onChange }: Props) => {
  const { t } = useTranslation();
  const current =
    isMyPlayed === undefined ? SCORE_LIST_DEFAULT_PLAY_STATE : isMyPlayed;
  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>{t("filter.playState")}</SectionTitle>
      <div className="flex items-center gap-2" role="radiogroup">
        {OPTIONS.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={current === o.value}
            onClick={() => onChange({ isMyPlayed: o.value })}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-bold transition-colors",
              current === o.value
                ? "border-bpim-primary bg-bpim-primary/15 text-bpim-primary"
                : "border-bpim-border text-bpim-muted hover:bg-bpim-overlay hover:text-bpim-text",
            )}
          >
            {t(o.label)}
          </button>
        ))}
      </div>
    </section>
  );
};

export default PlayStateSection;
