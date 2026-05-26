"use client";

import { FilterParamsFrontend } from "@/types/songs/score";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionTitle } from "./SectionTitle";
import { useTranslation } from "@/hooks/common/useTranslation";
import { type TranslationKey } from "@/lib/i18n/translations";

const PERIOD_VALUES = ["today", "yesterday", "thisWeek", "thisMonth", "past7", "past30"] as const;

interface Props {
  since: string | undefined;
  until: string | undefined;
  onChange: (val: Partial<FilterParamsFrontend>) => void;
}

export const DateSection = ({ since, until, onChange }: Props) => {
  const { t } = useTranslation();
  const PERIOD_OPTIONS = PERIOD_VALUES.map((value) => ({
    label: t(`filter.period.${value}` as TranslationKey),
    value,
  }));
  const isCustomActive = since && !PERIOD_OPTIONS.find((v) => v.value === since);

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>{t("filter.lastUpdated")}</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            size="xs"
            variant={since === opt.value ? "default" : "outline"}
            className={cn(
              "h-7 px-2 rounded-full border-bpim-border",
              since === opt.value ? "bg-bpim-primary" : "bg-transparent text-bpim-muted",
            )}
            onClick={() =>
              onChange({
                since: since === opt.value ? undefined : (opt.value as FilterParamsFrontend["since"]),
                until: undefined,
              })
            }
          >
            {opt.label}
          </Button>
        ))}
        <Button
          size="xs"
          variant={isCustomActive ? "default" : "outline"}
          className={cn(
            "h-7 px-2 rounded-full border-bpim-border",
            isCustomActive ? "bg-bpim-primary" : "bg-transparent text-bpim-muted",
          )}
          onClick={() => {
            if (isCustomActive) {
              onChange({ since: undefined, until: undefined });
            } else {
              const today = dayjs().tz().format("YYYY-MM-DD");
              onChange({ since: today, until: today });
            }
          }}
        >
          {t("filter.period.custom")}
        </Button>
      </div>

      {isCustomActive && (
        <div className="flex flex-col gap-3 rounded-lg bg-bpim-surface-2/60 p-3">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] text-bpim-muted">{t("filter.startDate")}</Label>
              <Input
                type="date"
                className="h-8 border-bpim-border bg-bpim-bg text-xs scheme-dark"
                value={since || ""}
                onChange={(e) => onChange({ since: e.target.value })}
              />
            </div>
            <span className="mb-2 text-bpim-subtle text-xs">~</span>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] text-bpim-muted">{t("filter.endDate")}</Label>
              <Input
                type="date"
                className="h-8 border-bpim-border bg-bpim-bg text-xs scheme-dark"
                value={until || ""}
                onChange={(e) => onChange({ until: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
