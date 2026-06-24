"use client";

import { FilterParamsFrontend } from "@/types/songs/score";
import { verNameArr } from "@/constants/iidx/versions";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionTitle } from "./SectionTitle";
import { useTranslation } from "@/hooks/common/useTranslation";

interface Props {
  versions: number[] | undefined;
  onChange: (val: Partial<FilterParamsFrontend>) => void;
}

export const VersionSection = ({ versions, onChange }: Props) => {
  const { t } = useTranslation();
  return (
  <section className="flex flex-col gap-3">
    <SectionTitle>{t("filter.songVersion")}</SectionTitle>
    <ScrollArea className="h-50 w-full pr-4">
      <div className="grid grid-cols-2 gap-2">
        {verNameArr.map((name, index) => {
          if (!name) return null;
          const isChecked = versions?.includes(index);
          return (
            <div key={index} className="flex items-center gap-2">
              <Checkbox
                id={`ver-${index}`}
                checked={isChecked}
                onCheckedChange={() => {
                  const current = versions || [];
                  const next = isChecked
                    ? current.filter((i) => i !== index)
                    : [...current, index];
                  onChange({ versions: next });
                }}
              />
              <Label htmlFor={`ver-${index}`} className="text-xs truncate">
                {name}
              </Label>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  </section>
  );
};
