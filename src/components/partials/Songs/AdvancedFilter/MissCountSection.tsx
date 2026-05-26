"use client";

import { FilterParamsFrontend } from "@/types/songs/score";
import { Input } from "@/components/ui/input";
import { SectionTitle } from "./SectionTitle";
import { useTranslation } from "@/hooks/common/useTranslation";

interface Props {
  missCountMin: number | undefined;
  missCountMax: number | undefined;
  onChange: (val: Partial<FilterParamsFrontend>) => void;
}

export const MissCountSection = ({ missCountMin, missCountMax, onChange }: Props) => {
  const { t } = useTranslation();
  return (
  <section className="flex flex-col gap-3">
    <SectionTitle>{t("filter.missCount")}</SectionTitle>
    <div className="flex items-center gap-3">
      <Input
        placeholder={t("filter.missMin")}
        type="number"
        min={0}
        className="h-9 border-bpim-border bg-bpim-surface-2/60"
        value={missCountMin ?? ""}
        onChange={(e) =>
          onChange({ missCountMin: e.target.value ? Number(e.target.value) : undefined })
        }
      />
      <span className="text-bpim-subtle">~</span>
      <Input
        placeholder={t("filter.missMax")}
        type="number"
        min={0}
        className="h-9 border-bpim-border bg-bpim-surface-2/60"
        value={missCountMax ?? ""}
        onChange={(e) =>
          onChange({ missCountMax: e.target.value ? Number(e.target.value) : undefined })
        }
      />
    </div>
  </section>
  );
};
