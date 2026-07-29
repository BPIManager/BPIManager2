"use client";

import { FilterParamsFrontend } from "@/types/songs/score";
import { ALL_RADAR_CATEGORIES, RADAR_COLORS } from "@/constants/iidx/radars";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SectionTitle } from "./SectionTitle";
import { useTranslation } from "@/hooks/common/useTranslation";

interface Props {
  radarCategories: string[] | undefined;
  onChange: (val: Partial<FilterParamsFrontend>) => void;
}

export const RadarSection = ({ radarCategories, onChange }: Props) => {
  const { t } = useTranslation();
  const toggle = (cat: string) => {
    const current = radarCategories || [];
    const next = current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat];
    onChange({ radarCategories: next });
  };

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>{t("filter.radarCategory")}</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        {ALL_RADAR_CATEGORIES.map((cat) => (
          <div key={cat} className="flex items-center gap-2">
            <Checkbox
              id={`radar-${cat}`}
              checked={radarCategories?.includes(cat)}
              onCheckedChange={() => toggle(cat)}
            />
            <Label
              htmlFor={`radar-${cat}`}
              className="text-xs font-bold"
              style={{ color: RADAR_COLORS[cat as keyof typeof RADAR_COLORS] }}
            >
              {cat}
            </Label>
          </div>
        ))}
      </div>
    </section>
  );
};
